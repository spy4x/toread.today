import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as ogs from 'open-graph-scraper';

admin.initializeApp();
const firestore = admin.firestore();


console.log('--- COLD START ---');

export const itemCreate = functions.firestore
  .document(`items/{id}`)
  .onCreate(async docSnapshot => {
    const url = docSnapshot.data().url;
    const id = docSnapshot.id;
    console.log('itemCreate - Working on:', id, url);
    try {
      const { data } = await ogs({ url });
      const updateFields = {
        title: data.ogTitle || null,
        type: getType(data.ogType)
      };
      console.log('Result:', {
        updateFields,
        data: JSON.stringify(data, null, 2)
      });
      await docSnapshot.ref.update(updateFields);
    } catch (error) {
      console.error('itemCreate', error);
    }
  });


function getType(item: string): string {
  const defaultType = 'website';
  if (!item) {
    return defaultType;
  }
  const availableTypes = ['video', 'article', 'profile', defaultType];
  let result = defaultType;
  availableTypes.find(arrItem => {
    const contains = item.indexOf(arrItem) >= 0;
    if (contains) {
      result = arrItem;
    }
    return contains;
  });
  return result;
}


export const onTagDelete = functions.firestore
  .document(`tags/{id}`)
  .onDelete(async doc => {
    const id = doc.id;
    const tag = {...doc.data(), id: doc.id};
    console.log('onTagDelete - Working on tag:', id, tag);
    try {
      const items = await firestore
        .collection('items')
        .where('tags', 'array-contains', id)
        .get();

      console.log('onTagDelete - Found items:', items.docs.length, items.docs.map(d => d.id));

      const data = {
        tags: admin.firestore.FieldValue.arrayRemove(id)
      };

      const batch = firestore.batch();
      items.docs.forEach(d => batch.update(firestore.doc('items/'+d.id), data));
      await batch.commit();
      console.log('onTagDelete - Success');
    } catch (error) {
      console.error('onTagDelete', tag, error);
    }
  });
