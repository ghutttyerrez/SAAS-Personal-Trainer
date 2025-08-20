import { AuthService } from "../../services/auth";

// Mock simples para resolver problemas de tipo
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("../../repositories/auth", () => ({
  UserRepository: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    getPasswordHash: jest.fn(),
    updateLastLogin: jest.fn(),
    emailExists: jest.fn(),
  },
  TenantRepository: {
    findById: jest.fn(),
    createTenantWithUser: jest.fn(),
  },
}));

jest.mock("../../repositories/refreshToken", () => ({
  RefreshTokenRepository: {
    verify: jest.fn(),
    revoke: jest.fn(),
    revokeAllByUserId: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock("../../middleware/auth", () => ({
  generateToken: jest.fn(() => "mock-token"),
}));

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    const loginCredentials = {
      email: "test@example.com",
      password: "password123",
    };

    it("deve fazer login com credenciais válidas", async () => {
      const bcrypt = require("bcryptjs");
      const {
        UserRepository,
        TenantRepository,
      } = require("../../repositories/auth");

      const mockUser = {
        id: "user-1",
        tenantId: "tenant-1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "trainer",
        isActive: true,
      };

      const mockTenant = {
        id: "tenant-1",
        name: "Test Tenant",
        email: "tenant@example.com",
        planType: "basic",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      UserRepository.findByEmail.mockResolvedValue(mockUser);
      UserRepository.getPasswordHash.mockResolvedValue("hashed-password");
      bcrypt.compare.mockResolvedValue(true);
      TenantRepository.findById.mockResolvedValue(mockTenant);
      UserRepository.updateLastLogin.mockResolvedValue();

      const result = await AuthService.login(loginCredentials);

      expect(result.success).toBe(true);
      expect(UserRepository.findByEmail).toHaveBeenCalledWith(
        loginCredentials.email
      );
    });

    it("deve retornar erro para usuário não encontrado", async () => {
      const { UserRepository } = require("../../repositories/auth");
      UserRepository.findByEmail.mockResolvedValue(null);

      const result = await AuthService.login(loginCredentials);

      expect(result.success).toBe(false);
    });

    it("deve retornar erro para senha inválida", async () => {
      const bcrypt = require("bcryptjs");
      const { UserRepository } = require("../../repositories/auth");

      const mockUser = {
        id: "user-1",
        tenantId: "tenant-1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "trainer",
        isActive: true,
      };

      UserRepository.findByEmail.mockResolvedValue(mockUser);
      UserRepository.getPasswordHash.mockResolvedValue("hashed-password");
      bcrypt.compare.mockResolvedValue(false);

      const result = await AuthService.login(loginCredentials);

      expect(result.success).toBe(false);
    });
  });

  describe("register", () => {
    const registerData = {
      email: "new@example.com",
      password: "password123",
      firstName: "New",
      lastName: "User",
      tenantName: "New Business",
    };

    it("deve registrar novo usuário com sucesso", async () => {
      const bcrypt = require("bcryptjs");
      const {
        UserRepository,
        TenantRepository,
      } = require("../../repositories/auth");

      UserRepository.emailExists.mockResolvedValue(false);
      bcrypt.hash.mockResolvedValue("hashed-password");

      const mockTenant = {
        id: "tenant-1",
        name: "New Business",
        email: "new@example.com",
        planType: "basic",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUser = {
        id: "user-1",
        tenantId: "tenant-1",
        email: "new@example.com",
        firstName: "New",
        lastName: "User",
        role: "trainer",
        isActive: true,
      };

      TenantRepository.createTenantWithUser.mockResolvedValue({
        tenant: mockTenant,
        user: mockUser,
      });

      const result = await AuthService.register(registerData);

      expect(result.success).toBe(true);
      expect(UserRepository.findByEmail).toHaveBeenCalledWith(
        registerData.email
      );
    });

    it("deve retornar erro para email já existente", async () => {
      const { UserRepository } = require("../../repositories/auth");
      UserRepository.emailExists.mockResolvedValue(true);

      const result = await AuthService.register(registerData);

      expect(result.success).toBe(false);
    });
  });

  describe("refreshToken", () => {
    it("deve renovar token com refresh token válido", async () => {
      const {
        RefreshTokenRepository,
      } = require("../../repositories/refreshToken");
      const { UserRepository } = require("../../repositories/auth");

      const mockRefreshToken = {
        id: "rt-1",
        userId: "user-1",
        tokenHash: "hash",
        expiresAt: new Date(Date.now() + 86400000),
        isRevoked: false,
        createdAt: new Date(),
      };

      const mockUser = {
        id: "user-1",
        tenantId: "tenant-1",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "trainer",
        isActive: true,
      };

      RefreshTokenRepository.verify.mockResolvedValue(mockRefreshToken as any);
      UserRepository.findById.mockResolvedValue(mockUser as any);
      RefreshTokenRepository.create.mockResolvedValue("new-rt");
      RefreshTokenRepository.revoke.mockResolvedValue();

      const result = await AuthService.refreshToken("valid-refresh-token");

      expect(result.success).toBe(true);
    });

    it("deve retornar erro para refresh token inválido", async () => {
      const {
        RefreshTokenRepository,
      } = require("../../repositories/refreshToken");
      RefreshTokenRepository.verify.mockResolvedValue(null);

      const result = await AuthService.refreshToken("invalid-token");

      expect(result.success).toBe(false);
    });
  });
});
