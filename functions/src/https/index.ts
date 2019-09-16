import * as express from 'express';
import * as cors from 'cors';
import { authMiddleware } from './middlewares/auth.middleware';
import { itemsRouter } from './routes/items';
import { functions } from '../+utils/firebase/firebase';

const apiRouter = express.Router();
apiRouter.use('/items', itemsRouter);

const app = express();

// Middlewares - BEGIN
app.use((req: express.Request, res: express.Response, next: Function) => {
  console.log(`${req.method} ${unescape(req.originalUrl)}`);
  next();
});
app.use(cors());
// Middlewares - END

app.use('/api', authMiddleware, apiRouter);
app.use('*', (req, res) => res.status(404).send('Sorry... Nothing here.'));

export const httpsFunction = functions.https.onRequest(app);
