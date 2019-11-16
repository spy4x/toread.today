import { firestore } from './firebase';
import {firestore as firebaseNamespace} from 'firebase-admin';
const MAX_BATCH_OPERATIONS = 500;

interface BatchSwarmOperation {
  type: 'set' | 'update' | 'delete'
  ref: firebaseNamespace.DocumentReference
  data?: any;
}

export class BatchSwarm {
  private operations: BatchSwarmOperation[] = [];

  set(ref:firebaseNamespace.DocumentReference, data: any): this {
    this.operations.push({type: 'set', ref, data});
    return this;
  }
  update(ref:firebaseNamespace.DocumentReference, data: any): this {
    this.operations.push({type: 'update', ref, data});
    return this;
  }
  delete(ref:firebaseNamespace.DocumentReference): this {
    this.operations.push({type: 'delete', ref});
    return this;
  }

  getOperationsAmount(): number {
    return this.operations.length;
  }

  async commit(): Promise<void> {
    const maxOperations = MAX_BATCH_OPERATIONS;
    let batchIndex = 0;
    const batches: firebaseNamespace.WriteBatch[] = [];
    batches[batchIndex] = firestore.batch();
    this.operations.forEach((operation, index) => {
      const indexForCreatingNewBatch = maxOperations * (batchIndex + 1);
      if (index === indexForCreatingNewBatch) {
        ++batchIndex;
        batches[batchIndex] = firestore.batch();
      }
      switch (operation.type) {
        case 'set': {
          batches[batchIndex].set(operation.ref, operation.data);
          break;
        }
        case 'update': {
          batches[batchIndex].update(operation.ref, operation.data);
          break;
        }
        case 'delete': {
          batches[batchIndex].delete(operation.ref);
          break;
        }
      }

    });
    await Promise.all(batches.map(b => b.commit()));
  }
}
