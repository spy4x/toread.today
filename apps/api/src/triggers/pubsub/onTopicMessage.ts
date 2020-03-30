import * as functions from 'firebase-functions';
import { restoreBackupFn } from '../../features/restoreBackup/restoreBackup';

export const restoreBackup = functions.pubsub
  .topic('restoreBackup')
  .onPublish(restoreBackupFn);
