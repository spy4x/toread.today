export {auth, messaging} from 'firebase-admin';
export * from 'firebase-functions';
import * as fbAdmin from 'firebase-admin';
import * as fbFunctions from 'firebase-functions';

export const admin = (() => {
  if (!fbAdmin.apps.length) {
    fbAdmin.initializeApp();
  }
  return fbAdmin;
})();
export const firestore = admin.firestore();
export const FieldValue = fbAdmin.firestore.FieldValue;
export const bucket = admin.storage().bucket();
export const createId = (): string => firestore.collection('fakeCollection').doc().id;
export const functions = fbFunctions;


// Config initialization below

interface FirebaseFunctionsConfig {
  frontend: {
    url: string
  }
}

export const config: FirebaseFunctionsConfig = functions.config() as any;

if (!config.frontend) {
  throw new Error('Functions config: "frontend" property is missing');
}
if (!config.frontend.url || typeof config.frontend.url !== 'string') {
  const value = JSON.stringify(config.frontend.url, null, 2);
  throw new Error(`Functions config: "frontend.url" property is missing or not a string. Value: ${value}`);
}
