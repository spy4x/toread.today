// import { auth, GoogleAuth } from 'google-auth-library';

import { Message } from 'firebase-functions/lib/providers/pubsub';
import { auth, GoogleAuth } from 'google-auth-library';
import { BACKUP_BUCKET_NAME } from '../../+utils/common/constants';

export const restoreBackupFn = async (message: Message) => {
  try {
    if (!message || !message.attributes || !message.attributes['date']) {
      console.error(`Please provide a message with attribute "date" that has value in format "YYYY-MM-DD"`);
      return;
    }

    const date: string = message.attributes['date'];
    const projectId = await auth.getProjectId();
    const url = `https://firestore.googleapis.com/v1beta1/projects/${projectId}/databases/(default):importDocuments`;
    const backupPath = `gs://${BACKUP_BUCKET_NAME}/${date}`;

    console.log(
      `Going to restore Firestore backup for project "${projectId}" for date "${date}" from bucket "${BACKUP_BUCKET_NAME}".`
    );

    const client = await new GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/datastore',
        'https://www.googleapis.com/auth/cloud-platform' // We need these scopes
      ]
    });

    await client.request({
      url,
      method: 'POST',
      data: {
        inputUriPrefix: backupPath
        // collectionIds: [] // if you want to import only certain collections
      }
    });

    console.log(`Success. Backup was restored.`);
    return true;
  } catch (error) {
    console.error(`Failed.`, error);
    return false;
  }
};
