import { ValidationChain, validationResult } from 'express-validator';
import { Request, Response } from 'express';

/**
 * Validation middleware
 * @param validations from "express-validator"
 * @example
 * app.post('/api/create-user', validate([
   body('email').isEmail(),
   body('password').isLength({ min: 6 })
   ]), async (req, res, next) => {
    // request is guaranteed to not have any validation errors.
    const user = await User.create({ ... });
 });
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: Function) => {
    await Promise.all(validations.map(validation => validation.run(req as any)));

    const errors = validationResult(req as any);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};
