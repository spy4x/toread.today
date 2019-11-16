import { Item, ItemType } from '../../+utils/interfaces';
import { firestore } from '../../+utils/firebase/firebase';
import { isUrl } from '../../+utils/common';

const ogs = require('open-graph-scraper');

export const featureParseURL = {
  onCreate: async (item: Item): Promise<void> => {
    await parseURL(item, 'featureParseURL.onCreate():');
  },
  onUpdate: async (before: Item, after: Item): Promise<void> => {
    if (before.urlParseStatus !== 'notStarted' && after.urlParseStatus === 'notStarted') {
      await parseURL(after, 'featureParseURL.onUpdate():');
    }
  }
};

async function parseURL(item: Item, logPrefix: string): Promise<void> {
  try {
    if (!isUrl(item.url)) {
      await saveFailStatus(item, new Error('Provided URL is not valid'), logPrefix);
      return;
    }
    console.log(`${logPrefix} Working on:`, item);
    const { data } = await ogs({ url: item.url });
    const updateFields: Partial<Item> = {
      title: item.title || data.ogTitle as string || null,
      type: extractItemType(data.ogType),
      urlParseStatus: 'done',
      urlParseError: null
    };
    await firestore.doc(`items/${item.id}`).update(updateFields as any);
    console.log(`${logPrefix} Success`);
  } catch (error) {
    await saveFailStatus(item, error, logPrefix);
  }
}

function extractItemType(ogType: string): ItemType {
  const defaultType: ItemType = 'website';
  if (!ogType) {
    return defaultType;
  }
  const availableTypes: ItemType[] = [defaultType, 'video', 'article'];
  return availableTypes.find(type => ogType.indexOf(type) >= 0) || defaultType;
}

async function saveFailStatus(item: Item, error: Error, logPrefix: string): Promise<void> {
  console.error(`${logPrefix}`, error);
  const updateFields: Partial<Item> = {
    urlParseStatus: 'error',
    urlParseError: error['error'] || error.message || error.name || error['errorDetails'] || 'Parse URL failed.'
  };
  try {
    console.log(`${logPrefix} Saving failed status:`, updateFields);
    await firestore.doc(`items/${item.id}`).update(updateFields as any);
    console.log(`${logPrefix} Successfully saved failed status`);
  } catch (saveError) {
    console.error(`${logPrefix} Failed to save failed status`, saveError);
  }
}
