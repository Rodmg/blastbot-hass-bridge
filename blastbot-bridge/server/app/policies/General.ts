import { Request, Response } from "express";

/*
  Strips nested objects, substituting with their id (if any)
*/
export function stripNestedObjects() {
  return (req: Request, res: Response, next: Function) => {
    if (!req.body) req.body = {};
    // Iterate through all keys in the body
    for (const key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        // Validate if not from prototype
        if (
          Object.prototype.toString.call(req.body[key]) === "[object Object]"
        ) {
          // Append id and delete original
          if (req.body[key].id !== undefined)
            req.body[`${key}Id`] = req.body[key].id;
          delete req.body[key];
        }
      }
    }
    next();
  };
}
