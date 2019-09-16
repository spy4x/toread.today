import * as fbAdmin from 'firebase-admin';
import * as fbFunctions from 'firebase-functions';

export const admin = (() => {
  if (!fbAdmin.apps.length) {
    fbAdmin.initializeApp();
  }
  return fbAdmin;
})();
export const firestore = admin.firestore();
export const bucket = admin.storage().bucket();
export const createId = (): string => firestore.collection('fakeCollection').doc().id;
export const functions = fbFunctions;
