import { CollectionReference, DocumentSnapshot, Query } from '@firebase/firestore-types';
import { Action, AngularFirestore, DocumentChangeAction } from 'angularfire2/firestore';
import { first, map } from 'rxjs/operators';

export const unwrapCollectionSnapshotChanges = (actions: DocumentChangeAction<any>[]): any[] =>
  actions.map(a => {
    const data = a.payload.doc.data();
    const id = a.payload.doc.id;
    return { ...data, id };
  });

export const unwrapDocSnapshotChanges = (action: Action<DocumentSnapshot>): any => {
  const data = action.payload.data();
  const id = action.payload.id;
  return { ...data, id };
};

export const firestoreQueryStringStartsWith = (
  query: Query | CollectionReference,
  field: string,
  value: string,
): Query => {
  const strlength = value.length;
  const strFrontCode = value.slice(0, strlength - 1);
  const strEndCode = value.slice(strlength - 1, value.length);

  const startcode = value;
  const endcode = strFrontCode + String.fromCharCode(strEndCode.charCodeAt(0) + 1);

  return query.where(field, '>=', startcode).where(field, '<', endcode);
};

export const getFirestoreDoc = (db: AngularFirestore, path: string): Promise<any> => {
  return db
    .doc(path)
    .snapshotChanges()
    .pipe(first(), map(unwrapDocSnapshotChanges))
    .toPromise();
};
