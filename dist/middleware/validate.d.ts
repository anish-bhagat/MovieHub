import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
export declare function validateBody<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
export declare function validateQuery<T>(schema: ZodSchema<T>): (req: Request, res: Response, next: NextFunction) => void;
