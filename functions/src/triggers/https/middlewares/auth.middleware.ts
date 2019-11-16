import { Request, Response } from 'express';
import { admin } from '../../../+utils/firebase/firebase';

export async function authMiddleware(req: Request, res: Response, next: Function): Promise<void> {
  const token = getTokenFromHeader(req) || getTokenFromCookies(req);
  if (!token) {
    res.sendStatus(401);
    return;
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name,
      photoURL: decodedToken.picture,
    };
    req['user'] = user;
    return next();
  } catch (error) {
    console.error('authMiddleware(): Error while verifying token', error);
    res.sendStatus(403);
  }
}

function getTokenFromHeader(req: Request): null | string {
  const auth = req.headers.authorization;
  return (auth && auth.split('Bearer ')[1]) || null;
}

function getTokenFromCookies(req: Request): null | string {
  return (req.cookies && req.cookies.__session) || null;
}
