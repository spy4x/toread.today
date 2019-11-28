import { Item, ItemsCounter } from '../../+utils/interfaces';
import { firestore } from '../../+utils/firebase/firebase';
import { firestore as Firestore } from 'firebase-admin';

const logPrefix = 'featureItemsCounter():';

export const featureItemsCounter = {
  onCreate: async (item: Item): Promise<void> => {
    const increase: string[] = [
      'all',
      `statuses.${item.status}`,
      `types.${item.type || 'null'}`,
      `ratings.${item.rating}`,
      `priorities.${item.priority}`
    ];
    if (item.isFavourite) {
      increase.push('favourites');
    }
    if (item.urlParseError) {
      increase.push('urlParseError');
    }
    if (item.withComment) {
      increase.push('withComment');
    }
    item.tags.forEach(t => {
      increase.push(`tags.${t}`);
    });
    await updateCounter({ item, increase, decrease: [] });
  },
  onUpdate: async (before: Item, after: Item): Promise<void> => {
    const increase: string[] = [];
    const decrease: string[] = [];

    // statuses
    if (before.status !== after.status) {
      increase.push(`statuses.${after.status}`);
      decrease.push(`statuses.${before.status}`);
    }

    // ratings
    if (before.rating !== after.rating) {
      increase.push(`ratings.${after.rating}`);
      decrease.push(`ratings.${before.rating}`);
    }

    // priorities
    if (before.priority !== after.priority) {
      increase.push(`priorities.${after.priority}`);
      decrease.push(`priorities.${before.priority}`);
    }

    // types
    if (before.type !== after.type) {
      increase.push(`types.${after.type}`);
      decrease.push(`types.${before.type}`);
    }

    // favourites
    if (!before.isFavourite && after.isFavourite) {
      increase.push('favourites');
    }
    if (before.isFavourite && !after.isFavourite) {
      decrease.push('favourites');
    }

    // urlParseError
    if (!before.urlParseError && after.urlParseError) {
      increase.push('urlParseError');
    }
    if (before.urlParseError && !after.urlParseError) {
      decrease.push('urlParseError');
    }

    // withComment
    if (!before.withComment && after.withComment) {
      increase.push('withComment');
    }
    if (before.withComment && !after.withComment) {
      decrease.push('withComment');
    }

    // tags
    const tagsAdded = after.tags.filter(t => !before.tags.includes(t));
    const tagsRemoved = before.tags.filter(t => !after.tags.includes(t));
    tagsAdded.forEach(t => {
      increase.push(`tags.${t}`);
    });
    tagsRemoved.forEach(t => {
      decrease.push(`tags.${t}`);
    });

    await updateCounter({ item: after, increase, decrease });
  },
  onDelete: async (item: Item): Promise<void> => {
    const decrease: string[] = [
      'all',
      `statuses.${item.status}`,
      `types.${item.type || 'null'}`,
      `ratings.${item.rating}`,
      `priorities.${item.priority}`
    ];
    if (item.isFavourite) {
      decrease.push('favourites');
    }
    if (item.urlParseError) {
      decrease.push('urlParseError');
    }
    if (item.withComment) {
      decrease.push('withComment');
    }
    item.tags.forEach(t => {
      decrease.push(`tags.${t}`);
    });
    await updateCounter({ item, decrease, increase: [] });
  }
};

interface Params {
  item: Item,
  increase: string[],
  decrease: string[]
}

async function updateCounter({ item, increase, decrease }: Params): Promise<void> {
  try {
    console.log(`${logPrefix} Working on:`, { item, increase, decrease });
    const docRef = firestore.doc(`counterItems/${item.createdBy}`);

    // updating counter
    const update: Partial<ItemsCounter> = {};
    increase.forEach(f => {
      update[f] = Firestore.FieldValue.increment(1) as any;
    });
    decrease.forEach(f => {
      update[f] = Firestore.FieldValue.increment(-1) as any;
    });
    await docRef.set(update, { merge: true });

    console.log(`${logPrefix} Success`);
  } catch (error) {
    console.error(`${logPrefix}`, error);
  }
}
