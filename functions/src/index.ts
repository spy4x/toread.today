import * as functions from 'firebase-functions';
import * as ogs from 'open-graph-scraper';


console.log('--- COLD START ---');

export const itemCreate = functions.firestore
  .document(`items/{id}`)
  .onCreate(async docSnapshot => {
    const url = docSnapshot.data().url;
    const id = docSnapshot.id;
    try {
      const { data } = await ogs({ url });
      const updateFields = {
        title: data.ogTitle || null,
        description: data.ogDescription || null,
        type: getType(data.ogType)
      };
      console.log('Result:', {
        id,
        url,
        updateFields,
        data: JSON.stringify(data, null, 2)
      });
      await docSnapshot.ref.update(updateFields);
    } catch (error) {
      console.error('itemCreate', { url, id }, error);
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
    const contains = arrItem.indexOf(item) >= 0;
    if (contains) {
      result = arrItem;
    }
    return contains;
  });
  return result;
}
