// Mock da função query primeiro
jest.mock("../../config/database", () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

import { UserRepository, TenantRepository } from "../../repositories/auth";
import { query } from "../../config/database";

const mockedQuery = jest.mocked(query);

describe("UserRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findByEmail", () => {
    test("deve retornar usuário quando encontrado", async () => {
      const mockUser = {
        id: "1",
        tenant_id: "tenant1",
        email: "test@test.com",
        first_name: "Test",
        last_name: "User",
        role: "admin",
        is_active: true,
        last_login_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockedQuery.mockResolvedValue({
        rows: [mockUser],
        rowCount: 1,
      } as any);

      const result = await UserRepository.findByEmail("test@test.com");

      expect(result).toEqual({
        id: mockUser.id,
        tenantId: mockUser.tenant_id,
        email: mockUser.email,
        firstName: mockUser.first_name,
        lastName: mockUser.last_name,
        role: mockUser.role,
        isActive: mockUser.is_active,
        lastLoginAt: mockUser.last_login_at,
        createdAt: mockUser.created_at,
        updatedAt: mockUser.updated_at,
      });
    });

    test("deve retornar null quando usuário não encontrado", async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await UserRepository.findByEmail("notfound@test.com");

      expect(result).toBeNull();
    });

    test("deve lançar erro quando há problema no banco", async () => {
      mockedQuery.mockRejectedValue(new Error("Database error"));

      await expect(UserRepository.findByEmail("test@test.com")).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("findById", () => {
    test("deve retornar usuário por ID", async () => {
      const mockUser = {
        id: "1",
        tenant_id: "tenant1",
        email: "test@test.com",
        first_name: "Test",
        last_name: "User",
        role: "admin",
        is_active: true,
        last_login_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockedQuery.mockResolvedValue({
        rows: [mockUser],
        rowCount: 1,
      } as any);

      const result = await UserRepository.findById("1");

      expect(result).toBeDefined();
      expect(result?.id).toBe("1");
    });
  });

  describe("emailExists", () => {
    test("deve retornar true quando email existe", async () => {
      mockedQuery.mockResolvedValue({
        rows: [{ count: "1" }],
        rowCount: 1,
      } as any);

      const result = await UserRepository.emailExists("existing@test.com");

      expect(result).toBe(true);
    });

    test("deve retornar false quando email não existe", async () => {
      mockedQuery.mockResolvedValue({
        rows: [{ count: "0" }],
        rowCount: 1,
      } as any);

      const result = await UserRepository.emailExists("new@test.com");

      expect(result).toBe(false);
    });
  });

  describe("updateLastLogin", () => {
    test("deve atualizar último login com sucesso", async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as any);

      await expect(
        UserRepository.updateLastLogin("user1")
      ).resolves.not.toThrow();
    });
  });
});

describe("TenantRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    test("deve retornar tenant por ID", async () => {
      const mockTenant = {
        id: "1",
        name: "Test Tenant",
        email: "tenant@test.com",
        phone: "123456789",
        plan_type: "basic",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockedQuery.mockResolvedValue({
        rows: [mockTenant],
        rowCount: 1,
      } as any);

      const result = await TenantRepository.findById("1");

      expect(result).toBeDefined();
      expect(result?.id).toBe("1");
      expect(result?.name).toBe("Test Tenant");
    });

    test("deve retornar null quando tenant não encontrado", async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await TenantRepository.findById("999");

      expect(result).toBeNull();
    });
  });
});
