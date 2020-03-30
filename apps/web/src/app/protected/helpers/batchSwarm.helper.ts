import { firestore as Firestore } from 'firebase/app';

const MAX_BATCH_OPERATIONS = 500;

interface BatchSwarmOperation {
  type: 'set' | 'update' | 'delete';
  ref: Firestore.DocumentReference;
  data?: any;
}

export class BatchSwarm {
  private operations: BatchSwarmOperation[] = [];

  constructor(private firestore: Firestore.Firestore) {}

  set(ref: Firestore.DocumentReference, data: any): this {
    this.operations.push({ type: 'set', ref, data });
    return this;
  }

  update(ref: Firestore.DocumentReference, data: any): this {
    this.operations.push({ type: 'update', ref, data });
    return this;
  }

  delete(ref: Firestore.DocumentReference): this {
    this.operations.push({ type: 'delete', ref });
    return this;
  }

  getOperationsAmount(): number {
    return this.operations.length;
  }

  async commit(): Promise<void> {
    const maxOperations = MAX_BATCH_OPERATIONS;
    let batchIndex = 0;
    const batches: Firestore.WriteBatch[] = [];
    batches[batchIndex] = this.firestore.batch();
    this.operations.forEach((operation, index) => {
      const indexForCreatingNewBatch = maxOperations * (batchIndex + 1);
      if (index === indexForCreatingNewBatch) {
        ++batchIndex;
        batches[batchIndex] = this.firestore.batch();
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
