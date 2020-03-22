import { auth, GoogleAuth } from 'google-auth-library';
import { BACKUP_BUCKET_NAME } from '../../+utils/common/constants';

export const createBackupFn = async (): Promise<boolean> => {
  try {
    const today = new Date();
    const date = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`; // example: 2020-3-22

    const projectId = await auth.getProjectId();
    const url = `https://firestore.googleapis.com/v1beta1/projects/${projectId}/databases/(default):exportDocuments`;
    const backupPath = `gs://${BACKUP_BUCKET_NAME}/${date}`;

    console.log(`Going to create Firestore backup for project "${projectId}" for date "${date}" to bucket "${BACKUP_BUCKET_NAME}".`);

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
        outputUriPrefix: backupPath
        // collectionsIds: [] // if you want to specify which collections to export, none means all
      }
    });

    console.log(`Success. Backup was created.`);
    return true;
  } catch (error) {
    console.error(`Failed.`, error);
    return false;
  }
};
