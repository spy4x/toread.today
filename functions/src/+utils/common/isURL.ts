const URL = require('url').URL;

export const isUrl = (url: string): boolean => {
  // TODO: use validator.js, because we already have it as dependency of "express-validator"
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}
