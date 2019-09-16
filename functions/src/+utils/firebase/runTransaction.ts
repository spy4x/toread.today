import { firestore } from './firebase';
import { sleep } from '../common/sleep';

export async function runTransaction<T>(
  transactionHandler: (transaction) => Promise<T>,
  {
    logPrefix = '',
    retries = 5,
    waitBetweenRetries = 1000,
    waitMultiplier = 1.5,
    useDispersion = true,
  }: {
    logPrefix?: string;
    retries?: number;
    waitBetweenRetries?: number;
    waitMultiplier?: number;
    useDispersion?: boolean;
  },
): Promise<T> {
  const retriesLeft = retries - 1;
  try {
    return await firestore.runTransaction<T>(transactionHandler);
  } catch (error) {
    if (error.code !== 10) {
      console.error(`${logPrefix}: Transaction error:`, error);
      return undefined as any;
    }
    if (!retriesLeft) {
      console.error(`${logPrefix}: Maximum retries count exceed, function stopped.`);
      return undefined as any;
    }
    const sleepTime = waitBetweenRetries + (useDispersion ? createDelta(waitBetweenRetries) : 0);
    const msg = `${logPrefix}: Transaction abort error! Count retries left: ${retriesLeft}. Next retry after: ${sleepTime} ms`;
    console[retriesLeft === 4 ? 'log' : 'error'](msg);
    await sleep(sleepTime);
    const waitTime = Math.floor(waitMultiplier * waitBetweenRetries);
    const newOptions = { logPrefix, retries: retriesLeft, waitBetweenRetries: waitTime, waitMultiplier, useDispersion };
    console.log(`${logPrefix}: Transaction restarted`);
    return runTransaction<T>(transactionHandler, newOptions);
  }
}

function createDelta(value: number, dispersion: number = 30): number {
  let dispersionCopy = dispersion;
  if (dispersionCopy < 0) {
    dispersionCopy = Math.abs(dispersionCopy);
  }
  if (dispersionCopy > 100) {
    dispersionCopy = 100;
  }
  const delta = Math.floor((dispersionCopy / 100) * Math.random() * value);
  return Math.random() > 0.5 ? delta : -delta;
}
