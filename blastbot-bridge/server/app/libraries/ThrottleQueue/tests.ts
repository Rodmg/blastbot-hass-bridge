import { ThrottleQueues } from "./ThrottleQueues";
import { THROTTLE_TIMEOUT } from "./constants";

const INTENDED_EXECUTIONS = 100;

function testSerialExecutions(
  throttler: ThrottleQueues,
  queueId: string,
): any[] {
  const executions = [];
  for (let i = 0; i < INTENDED_EXECUTIONS; i++) {
    throttler.do(queueId, () => {
      const now = new Date();
      console.log(`Executing ${queueId}:`, now);
      executions.push({
        time: now,
      });
    });
  }

  setTimeout(() => {
    // Validate execution time differencies
    const differencies = [];
    for (let i = 0; i < executions.length - 1; i++) {
      const diff =
        executions[i + 1].time.getTime() - executions[i].time.getTime();
      differencies.push(diff);
    }

    const n = differencies.length;
    const mean = differencies.reduce((a, b) => a + b) / n;
    const stdDev = Math.sqrt(
      differencies.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) /
        n,
    );

    console.log("Intended executions:", 100);
    console.log(`Actual executions ${queueId}:`, executions.length);
    console.log(`Differencies: mean: ${mean}, std deviation: ${stdDev}`);
  }, THROTTLE_TIMEOUT * INTENDED_EXECUTIONS + 100);

  return executions;
}

function testRandomExecutions(
  throttler: ThrottleQueues,
  queueId: string,
): any[] {
  const executions = [];
  for (let i = 0; i < INTENDED_EXECUTIONS; i++) {
    setTimeout(() => {
      console.log(`Triggering ${queueId}:`, new Date());
      throttler.do(queueId, () => {
        const now = new Date();
        console.log(`Executing ${queueId}:`, now);
        executions.push({
          time: now,
        });
      });
    }, 100 + Math.random() * 10000);
  }

  setTimeout(() => {
    // Validate execution time differencies
    const differencies = [];
    for (let i = 0; i < executions.length - 1; i++) {
      const diff =
        executions[i + 1].time.getTime() - executions[i].time.getTime();
      differencies.push(diff);
    }

    const n = differencies.length;
    const mean = differencies.reduce((a, b) => a + b) / n;
    const stdDev = Math.sqrt(
      differencies.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) /
        n,
    );

    console.log("Intended executions:", 100);
    console.log(`Actual executions ${queueId}:`, executions.length);
    console.log(`Differencies: mean: ${mean}, std deviation: ${stdDev}`);
  }, THROTTLE_TIMEOUT * INTENDED_EXECUTIONS + 1000);

  return executions;
}

export function testAll() {
  const throttler = new ThrottleQueues();

  testSerialExecutions(throttler, "A");
  testSerialExecutions(throttler, "B");
  testSerialExecutions(throttler, "C");
  testSerialExecutions(throttler, "D");

  testRandomExecutions(throttler, "E");
  testRandomExecutions(throttler, "F");
  testRandomExecutions(throttler, "G");
  testRandomExecutions(throttler, "H");
}
