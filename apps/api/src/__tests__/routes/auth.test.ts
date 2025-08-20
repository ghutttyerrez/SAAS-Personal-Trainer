import express from "express";
import request from "supertest";
import authRoutes from "../../routes/auth";
import { AuthService } from "../../services/auth";
import { TestUtils } from "../utils";

// Mock do AuthService com métodos estáticos
jest.mock("../../services/auth", () => ({
  AuthService: {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  },
}));

// Cast para tipo mockado
const mockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe("Auth Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    // Configura app Express para testes
    app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);

    // Reset dos mocks
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("deve registrar um novo usuário com dados válidos", async () => {
      const userData = {
        name: "João Silva",
        email: "joao@example.com",
        password: "senha123456",
        tenant_name: "Academia João",
      };

      const mockResponse = {
        success: true,
        user: {
          id: "user-123",
          tenantId: "tenant-123",
          email: "joao@example.com",
          firstName: "João",
          lastName: "Silva",
          role: "trainer" as const,
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        tenant: {
          id: "tenant-123",
          name: "Academia João",
          email: "joao@example.com",
          planType: "basic" as const,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        token: "mock-jwt-token",
        refreshToken: "mock-refresh-token",
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        user: {
          id: "user-123",
          tenantId: "tenant-123",
          email: "joao@example.com",
          firstName: "João",
          lastName: "Silva",
          role: "trainer",
          isActive: true,
        },
        tenant: {
          id: "tenant-123",
          name: "Academia João",
          email: "joao@example.com",
          planType: "basic",
          isActive: true,
        },
        token: "mock-jwt-token",
        refreshToken: "mock-refresh-token",
      });
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: "joao@example.com",
        password: "senha123456",
        firstName: "João",
        lastName: "Silva",
        tenantName: "Academia João",
      });
    });

    it("deve retornar erro 400 para dados inválidos", async () => {
      const invalidData = {
        name: "A", // Muito curto
        email: "email-invalido",
        password: "123", // Muito curta
        // tenant_name ausente
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        message: "Dados de entrada inválidos",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "name",
            message: "Nome deve ter pelo menos 2 caracteres",
          }),
          expect.objectContaining({
            field: "email",
            message: "Email deve ter um formato válido",
          }),
          expect.objectContaining({
            field: "password",
            message: "Senha deve ter pelo menos 6 caracteres",
          }),
        ]),
      });
      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it("deve retornar erro 400 quando o serviço falha", async () => {
      const userData = {
        name: "João Silva",
        email: "joao@example.com",
        password: "senha123456",
        tenant_name: "Academia João",
      };

      const mockErrorResponse: { success: false; message: string } = {
        success: false,
        message: "Email já está em uso",
      };

      mockAuthService.register.mockResolvedValue(mockErrorResponse);

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body).toEqual(mockErrorResponse);
      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: "joao@example.com",
        password: "senha123456",
        firstName: "João",
        lastName: "Silva",
        tenantName: "Academia João",
      });
    });

    it("deve retornar erro 500 para exceções não tratadas", async () => {
      const userData = {
        name: "João Silva",
        email: "joao@example.com",
        password: "senha123456",
        tenant_name: "Academia João",
      };

      mockAuthService.register.mockRejectedValue(
        new Error("Database connection failed")
      );

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        message: "Erro interno no registro",
      });
    });
  });

  describe("POST /api/auth/login", () => {
    it("deve fazer login com credenciais válidas", async () => {
      const loginData = {
        email: "joao@example.com",
        password: "senha123456",
      };

      const mockResponse = {
        success: true,
        user: {
          id: "user-123",
          tenantId: "tenant-123",
          email: "joao@example.com",
          firstName: "João",
          lastName: "Silva",
          role: "trainer" as const,
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        tenant: {
          id: "tenant-123",
          name: "Academia João",
          email: "joao@example.com",
          planType: "basic" as const,
          isActive: true,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        token: "mock-jwt-token",
        refreshToken: "mock-refresh-token",
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        user: {
          id: "user-123",
          tenantId: "tenant-123",
          email: "joao@example.com",
          firstName: "João",
          lastName: "Silva",
          role: "trainer",
          isActive: true,
        },
        tenant: {
          id: "tenant-123",
          name: "Academia João",
          email: "joao@example.com",
          planType: "basic",
          isActive: true,
        },
        token: "mock-jwt-token",
        refreshToken: "mock-refresh-token",
      });
      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
    });

    it("deve retornar erro 400 para dados inválidos", async () => {
      const invalidData = {
        email: "email-invalido",
        password: "", // Senha vazia
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        message: "Dados de entrada inválidos",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "email",
            message: "Email deve ter um formato válido",
          }),
          expect.objectContaining({
            field: "password",
            message: "Senha é obrigatória",
          }),
        ]),
      });
      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it("deve retornar erro 401 para credenciais inválidas", async () => {
      const loginData = {
        email: "joao@example.com",
        password: "senhaerrada",
      };

      const mockErrorResponse: { success: false; message: string } = {
        success: false,
        message: "Credenciais inválidas",
      };

      mockAuthService.login.mockResolvedValue(mockErrorResponse);

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual(mockErrorResponse);
      expect(mockAuthService.login).toHaveBeenCalledWith(loginData);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("deve renovar token com refresh token válido", async () => {
      const refreshData = {
        refreshToken: "valid-refresh-token",
      };

      const mockResponse = {
        success: true,
        data: {
          token: "new-jwt-token",
          refreshToken: "new-refresh-token",
        },
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post("/api/auth/refresh")
        .send(refreshData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        "valid-refresh-token"
      );
    });

    it("deve retornar erro 400 para refresh token ausente", async () => {
      const response = await request(app).post("/api/auth/refresh").send({});

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        message: "Dados de entrada inválidos",
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: "refreshToken",
            message: expect.stringContaining(
              "expected string, received undefined"
            ),
          }),
        ]),
      });
      expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
    });

    it("deve retornar erro 401 para refresh token inválido", async () => {
      const refreshData = {
        refreshToken: "invalid-refresh-token",
      };

      const mockErrorResponse = {
        success: false,
        message: "Refresh token inválido",
      };

      mockAuthService.refreshToken.mockResolvedValue(mockErrorResponse);

      const response = await request(app)
        .post("/api/auth/refresh")
        .send(refreshData);

      expect(response.status).toBe(401);
      expect(response.body).toEqual(mockErrorResponse);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(
        "invalid-refresh-token"
      );
    });
  });
});
