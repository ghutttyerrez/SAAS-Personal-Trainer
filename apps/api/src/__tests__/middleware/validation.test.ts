import { Request, Response, NextFunction } from "express";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../../middleware/validation";
import { z } from "zod";

describe("Validation Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe("validateBody", () => {
    const testSchema = z.object({
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      email: z.string().email("Email inválido"),
      age: z.number().min(18, "Idade mínima é 18 anos"),
    });

    it("deve validar dados válidos corretamente", () => {
      mockRequest.body = {
        name: "João Silva",
        email: "joao@example.com",
        age: 25,
      };

      const middleware = validateBody(testSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect((mockRequest as any).validatedData).toEqual({
        name: "João Silva",
        email: "joao@example.com",
        age: 25,
      });
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("deve retornar erro para dados inválidos", () => {
      mockRequest.body = {
        name: "A",
        email: "email-invalido",
        age: 15,
      };

      const middleware = validateBody(testSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados de entrada inválidos",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "name",
            message: "Nome deve ter pelo menos 2 caracteres",
          }),
          expect.objectContaining({
            field: "email",
            message: "Email inválido",
          }),
          expect.objectContaining({
            field: "age",
            message: "Idade mínima é 18 anos",
          }),
        ]),
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("deve retornar erro para campos obrigatórios ausentes", () => {
      mockRequest.body = {};

      const middleware = validateBody(testSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Dados de entrada inválidos",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "name",
            message: expect.stringContaining(
              "expected string, received undefined"
            ),
          }),
        ]),
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe("validateParams", () => {
    const uuidSchema = z.object({
      id: z.string().uuid("ID deve ser um UUID válido"),
    });

    it("deve validar UUID válido", () => {
      mockRequest.params = {
        id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const middleware = validateParams(uuidSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect((mockRequest as any).validatedData).toEqual({
        params: {
          id: "123e4567-e89b-12d3-a456-426614174000",
        },
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it("deve retornar erro para UUID inválido", () => {
      mockRequest.params = {
        id: "invalid-uuid",
      };

      const middleware = validateParams(uuidSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Parâmetros de URL inválidos",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "id",
            message: "ID deve ser um UUID válido",
          }),
        ]),
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe("validateQuery", () => {
    const paginationSchema = z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional(),
      limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    });

    it("deve validar query parameters válidos", () => {
      mockRequest.query = {
        page: "1",
        limit: "10",
      };

      const middleware = validateQuery(paginationSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect((mockRequest as any).validatedData).toEqual({
        query: {
          page: 1,
          limit: 10,
        },
      });
      expect(nextFunction).toHaveBeenCalled();
    });

    it("deve retornar erro para query parameters inválidos", () => {
      mockRequest.query = {
        page: "invalid",
        limit: "invalid",
      };

      const middleware = validateQuery(paginationSchema);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "Parâmetros de consulta inválidos",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "page",
          }),
          expect.objectContaining({
            field: "limit",
          }),
        ]),
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
