// Mock dos repositories primeiro
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
    create: jest.fn(),
  },
}));

jest.mock("../../repositories/refreshToken", () => ({
  RefreshTokenRepository: {
    create: jest.fn(),
    findValidTokenForUser: jest.fn(),
    invalidateToken: jest.fn(),
    invalidateAllUserTokens: jest.fn(),
  },
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

import { AuthService } from "../../services/auth";
import { UserRepository, TenantRepository } from "../../repositories/auth";
import { RefreshTokenRepository } from "../../repositories/refreshToken";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const mockedUserRepo = jest.mocked(UserRepository);
const mockedTenantRepo = jest.mocked(TenantRepository);
const mockedRefreshTokenRepo = jest.mocked(RefreshTokenRepository);
const mockedBcrypt = jest.mocked(bcrypt);
const mockedJwt = jest.mocked(jwt);

describe.skip("AuthService (comprehensive)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    test("deve registrar novo usuário e tenant com sucesso", async () => {
      const registerData = {
        email: "test@test.com",
        password: "password123",
        firstName: "Test",
        lastName: "User",
        role: "admin" as const,
        businessName: "Test Business",
        businessEmail: "business@test.com",
        businessPhone: "123456789",
      };

      const mockTenant = {
        id: "tenant-id",
        name: "Test Business",
        email: "business@test.com",
        phone: "123456789",
        planType: "basic",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUser = {
        id: "user-id",
        tenantId: "tenant-id",
        email: "test@test.com",
        firstName: "Test",
        lastName: "User",
        role: "admin",
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedUserRepo.emailExists.mockResolvedValue(false);
      mockedBcrypt.hash.mockResolvedValue("hashed-password" as never);
      mockedTenantRepo.create.mockResolvedValue(mockTenant);
      mockedUserRepo.create.mockResolvedValue(mockUser);

      const result = await AuthService.register(registerData);

      expect(result).toEqual({
        user: mockUser,
        tenant: mockTenant,
      });

      expect(mockedUserRepo.emailExists).toHaveBeenCalledWith("test@test.com");
      expect(mockedBcrypt.hash).toHaveBeenCalledWith("password123", 12);
      expect(mockedTenantRepo.create).toHaveBeenCalled();
      expect(mockedUserRepo.create).toHaveBeenCalled();
    });

    test("deve lançar erro quando email já existe", async () => {
      const registerData = {
        email: "existing@test.com",
        password: "password123",
        firstName: "Test",
        lastName: "User",
        role: "admin" as const,
        businessName: "Test Business",
        businessEmail: "business@test.com",
      };

      mockedUserRepo.emailExists.mockResolvedValue(true);

      await expect(AuthService.register(registerData)).rejects.toThrow(
        "Email já está sendo usado"
      );
    });
  });

  describe("login", () => {
    test("deve fazer login com sucesso", async () => {
      const loginData = {
        email: "test@test.com",
        password: "password123",
      };

      const mockUser = {
        id: "user-id",
        tenantId: "tenant-id",
        email: "test@test.com",
        firstName: "Test",
        lastName: "User",
        role: "admin",
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTenant = {
        id: "tenant-id",
        name: "Test Business",
        email: "business@test.com",
        phone: "123456789",
        planType: "basic",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRefreshToken = {
        id: "token-id",
        token: "refresh-token",
        userId: "user-id",
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      mockedUserRepo.findByEmail.mockResolvedValue(mockUser);
      mockedUserRepo.getPasswordHash.mockResolvedValue("hashed-password");
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedTenantRepo.findById.mockResolvedValue(mockTenant);
      mockedJwt.sign.mockReturnValue("access-token" as never);
      mockedRefreshTokenRepo.create.mockResolvedValue(mockRefreshToken);
      mockedUserRepo.updateLastLogin.mockResolvedValue();

      const result = await AuthService.login(loginData);

      expect(result).toEqual({
        user: mockUser,
        tenant: mockTenant,
        tokens: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
        },
      });

      expect(mockedUserRepo.findByEmail).toHaveBeenCalledWith("test@test.com");
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashed-password"
      );
      expect(mockedUserRepo.updateLastLogin).toHaveBeenCalledWith("user-id");
    });

    test("deve lançar erro quando usuário não existe", async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        AuthService.login({
          email: "notfound@test.com",
          password: "password123",
        })
      ).rejects.toThrow("Credenciais inválidas");
    });

    test("deve lançar erro quando senha está incorreta", async () => {
      const mockUser = {
        id: "user-id",
        tenantId: "tenant-id",
        email: "test@test.com",
        firstName: "Test",
        lastName: "User",
        role: "admin",
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedUserRepo.findByEmail.mockResolvedValue(mockUser);
      mockedUserRepo.getPasswordHash.mockResolvedValue("hashed-password");
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        AuthService.login({
          email: "test@test.com",
          password: "wrong-password",
        })
      ).rejects.toThrow("Credenciais inválidas");
    });
  });

  describe("refreshToken", () => {
    test("deve renovar token com sucesso", async () => {
      const mockRefreshToken = {
        id: "token-id",
        token: "refresh-token",
        userId: "user-id",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias no futuro
        createdAt: new Date(),
      };

      const mockUser = {
        id: "user-id",
        tenantId: "tenant-id",
        email: "test@test.com",
        firstName: "Test",
        lastName: "User",
        role: "admin",
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTenant = {
        id: "tenant-id",
        name: "Test Business",
        email: "business@test.com",
        planType: "basic",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockedRefreshTokenRepo.findValidTokenForUser.mockResolvedValue(
        mockRefreshToken
      );
      mockedUserRepo.findById.mockResolvedValue(mockUser);
      mockedTenantRepo.findById.mockResolvedValue(mockTenant);
      mockedJwt.sign.mockReturnValue("new-access-token" as never);

      const result = await AuthService.refreshToken("refresh-token");

      expect(result).toEqual({
        user: mockUser,
        tenant: mockTenant,
        accessToken: "new-access-token",
      });
    });

    test("deve lançar erro quando refresh token é inválido", async () => {
      mockedRefreshTokenRepo.findValidTokenForUser.mockResolvedValue(null);

      await expect(AuthService.refreshToken("invalid-token")).rejects.toThrow(
        "Refresh token inválido"
      );
    });
  });

  describe("logout", () => {
    test("deve fazer logout invalidando o token", async () => {
      mockedRefreshTokenRepo.invalidateToken.mockResolvedValue();

      await expect(AuthService.logout("refresh-token")).resolves.not.toThrow();

      expect(mockedRefreshTokenRepo.invalidateToken).toHaveBeenCalledWith(
        "refresh-token"
      );
    });
  });

  describe("logoutAllDevices", () => {
    test("deve invalidar todos os tokens do usuário", async () => {
      mockedRefreshTokenRepo.invalidateAllUserTokens.mockResolvedValue();

      await expect(
        AuthService.logoutAllDevices("user-id")
      ).resolves.not.toThrow();

      expect(
        mockedRefreshTokenRepo.invalidateAllUserTokens
      ).toHaveBeenCalledWith("user-id");
    });
  });
});
