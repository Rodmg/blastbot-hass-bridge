/*
  ThrottleQueues
    Provides a set of Queues to throttle actions
*/

import { log } from "@/libraries/Log";
import { MAX_QUEUE_SIZE, THROTTLE_TIMEOUT } from "./constants";

interface Queue {
  actions: (() => void)[];
  lastAction: Date | null;
  nextScheduleId: NodeJS.Timeout | null;
}

interface Queues {
  [queueId: string]: Queue;
}

export class ThrottleQueues {
  queues: Queues = {};

  do(queueId: string, action: () => void) {
    if (this.queues[queueId] == null) {
      this.queues[queueId] = {
        actions: [],
        lastAction: null,
        nextScheduleId: null,
      };
    }
    if (this.queues[queueId].actions.length >= MAX_QUEUE_SIZE - 1) {
      log.warn(
        `ThrottleQueues: Max Queue lenght reached for queue ${queueId}, dropping action.`,
      );
      return;
    }

    this.queues[queueId].actions.push(action);
    this.serviceQueue(queueId);
  }

  private serviceQueue(queueId: string) {
    const queue = this.queues[queueId];

    const now = new Date();

    if (!queue.actions.length) {
      // Nothing to do
      return;
    }

    if (queue.nextScheduleId != null) {
      // Already scheduled, wait
      return;
    }

    if (queue.lastAction == null) {
      // No previous actions, execute immediately
      const action = queue.actions.shift();
      queue.lastAction = new Date();
      action();
      this.serviceQueue(queueId);
    } else if (now.getTime() - queue.lastAction.getTime() > THROTTLE_TIMEOUT) {
      // Previous action executed enough time ago, execute immediately
      const action = queue.actions.shift();
      queue.lastAction = new Date();
      action();
      this.serviceQueue(queueId);
    } else {
      // We need to throttle
      const timePassed = now.getTime() - queue.lastAction.getTime();
      queue.nextScheduleId = setTimeout(() => {
        queue.nextScheduleId = null;
        this.serviceQueue(queueId);
      }, THROTTLE_TIMEOUT - timePassed);
    }
  }
}
