import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

export interface ValidatedRequest<T = any> extends Request {
  validatedData: T;
}

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      // Merge com dados já validados (params/query) para evitar sobrescrever
      (req as ValidatedRequest).validatedData = {
        ...(req as ValidatedRequest).validatedData,
        ...(validatedData as any),
      };
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dados de entrada inválidos",
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.query);
      (req as ValidatedRequest).validatedData = {
        ...(req as ValidatedRequest).validatedData,
        query: validatedData,
      };
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Parâmetros de consulta inválidos",
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.params);
      (req as ValidatedRequest).validatedData = {
        ...(req as ValidatedRequest).validatedData,
        params: validatedData,
      };
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Parâmetros de URL inválidos",
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};
