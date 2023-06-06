/*
  MqttRequest
    Simulates request-response petition over MQTT
*/

import { EventEmitter } from "events";
import mqtt from "mqtt";
import upath from "upath";
import { ThrottleQueues } from "./ThrottleQueue";

const REQ_TIMEOUT = 10000;

export class MqttRequester extends EventEmitter {
  throttleQueues: ThrottleQueues;

  constructor(
    private client: mqtt.Client,
    private reqEnd: string = "req",
    private resEnd: string = "res",
  ) {
    super();

    this.throttleQueues = new ThrottleQueues();

    if (this.client.connected) this.subscribeAll();

    this.client.on("connect", () => {
      this.subscribeAll();
    });

    this.client.on("message", (topic, message) => {
      this.emit(topic, message);
    });
  }

  private subscribeAll() {
    const topic = upath.join("+/+/", this.resEnd);
    this.client.subscribe(topic);
  }

  do(
    url: string,
    data?: string,
    timeout: number = REQ_TIMEOUT,
  ): Promise<string> {
    if (data == null) data = "";

    const resTopic: string = upath.join(url, this.resEnd);
    const reqTopic: string = upath.join(url, this.reqEnd);

    return new Promise((resolve, reject) => {
      let tout = null;
      const confirmCb = (data) => {
        if (tout) {
          clearTimeout(tout);
          this.removeListener(resTopic, confirmCb);
          return resolve(data);
        }
      };
      tout = setTimeout(() => {
        tout = null;
        this.removeListener(resTopic, confirmCb);
        return reject(new Error("MQTT request timeout"));
      }, timeout);
      this.once(resTopic, confirmCb);
      this.publish(reqTopic, data, { qos: 1 });
    });
  }

  publish(
    topic: string,
    data?: string | Buffer,
    options?: mqtt.IClientPublishOptions,
  ) {
    const udid = topic.split("/")[0];
    this.throttleQueues.do(udid, () => {
      this.client.publish(topic, data, options);
    });
  }
}
