import * as express from 'express';
import { bulk, bulkValidators } from './bulk';
import { validate } from '../../middlewares/validation.middleware';

const itemsRouter = express.Router();
itemsRouter.post('/bulk', validate(bulkValidators), bulk);
export { itemsRouter };

