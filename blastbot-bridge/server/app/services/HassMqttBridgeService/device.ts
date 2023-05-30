import { Device } from "@/models/Device";
import { MQTTDiscoveryDevice } from "./interfaces";
import { config } from "@/config";

export async function getDiscoveryDeviceDetails(
  device: Device,
): Promise<MQTTDiscoveryDevice> {
  let model = "Blastbot Smart Control";

  switch (device.type) {
    case "blastbot-ir":
      model = "Blastbot Smart Control";
      break;
    case "blastbot-hub":
      model = "Blastbot Hub";
      break;
    case "blastbot-plug":
      model = "Blastbot Plug";
      break;
    case "blastbot-switch":
      model = "Blastbot Switch (2 Buttons)";
      break;
    case "blastbot-switch-1":
      model = "Blastbot Switch (1 Button)";
      break;
    case "blastbot-switch-3":
      model = "Blastbot Switch (3 Buttons)";
      break;
    case "virtual-pir":
    case "virtual-door":
    case "virtual-button":
    // TODO?
  }
  return {
    configuration_url: config.urls.base,
    identifiers: [device.udid],
    manufacturer: "Blastbot",
    model,
    name: device.name,
    sw_version: device.version,
  };
}
