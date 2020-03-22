import * as functions from 'firebase-functions'
import { createBackupFn } from '../../features/createBackup/createBackup';

export const createBackup = functions.pubsub
  .schedule('0 0 * * *')
  .onRun(createBackupFn)
