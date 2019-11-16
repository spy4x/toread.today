import { Request, Response } from 'express';
import { bucket, createId } from '../../../../+utils/firebase/firebase';
import { body } from 'express-validator';

export const bulkValidators = [
  body('items', 'Should be array').isArray(),
  body('items.*.url', 'Should be string').isString().not().isEmpty(),
  body('items.*.tags', 'Should be array').isArray(),
  body('items.*.tags.*', 'Should be string').isString(),
  body('items.*.title', 'Should be string').optional({nullable: true}).isString(),
  body('tags', 'Should be array').isArray(),
  body('tags.*', 'Should be string').isString(),
  body('priority', 'Should be number').isNumeric(),
];

export const bulk = async (req: Request, res: Response): Promise<void> => {
  const path = `users/${req['user'].id}/imports/${createId()}`;
  try {
    console.log('bulk(): start uploading file', {path});
    await bucket.file(path).save(JSON.stringify(req.body), {
      resumable: false,
      gzip: true,
      contentType: 'application/json'
    });
    console.log('bulk(): done');
    res.json();
  } catch (error) {
    console.error('bulk()', error);
    res.sendStatus(500);
  }
};
