// Mock da função query primeiro
jest.mock("../../config/database", () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

import {
  UserRepository,
  TenantRepository,
  CreateUserData,
  CreateTenantData,
} from "../../repositories/auth";
import { query } from "../../config/database";

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe.skip("UserRepository (extended)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findByEmail", () => {
    it("deve retornar usuário quando encontrado", async () => {
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

      expect(mockedQuery).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE email = $1 AND is_active = true",
        ["test@test.com"]
      );
    });

    it("deve retornar null quando usuário não encontrado", async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await UserRepository.findByEmail("notfound@test.com");

      expect(result).toBeNull();
    });

    it("deve lançar erro quando há problema no banco", async () => {
      mockedQuery.mockRejectedValue(new Error("Database error"));

      await expect(UserRepository.findByEmail("test@test.com")).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("findById", () => {
    it("deve retornar usuário por ID", async () => {
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

    it("deve retornar null quando usuário não encontrado por ID", async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await UserRepository.findById("999");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("deve criar novo usuário com sucesso", async () => {
      const userData: CreateUserData = {
        email: "new@test.com",
        passwordHash: "hashedpassword",
        firstName: "New",
        lastName: "User",
        role: "admin",
        tenantId: "tenant1",
      };

      const mockCreatedUser = {
        id: "new-id",
        tenant_id: userData.tenantId,
        email: userData.email,
        first_name: userData.firstName,
        last_name: userData.lastName,
        role: userData.role,
        is_active: true,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockedQuery.mockResolvedValue({
        rows: [mockCreatedUser],
        rowCount: 1,
      } as any);

      const result = await UserRepository.create(userData);

      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.firstName).toBe(userData.firstName);
      expect(result.lastName).toBe(userData.lastName);
    });

    it("deve lançar erro quando email já existe", async () => {
      const userData: CreateUserData = {
        email: "existing@test.com",
        passwordHash: "hashedpassword",
        firstName: "Existing",
        lastName: "User",
        role: "admin",
        tenantId: "tenant1",
      };

      mockedQuery.mockRejectedValue(new Error("Duplicate email"));

      await expect(UserRepository.create(userData)).rejects.toThrow(
        "Duplicate email"
      );
    });
  });

  describe("getPasswordHash", () => {
    it("deve retornar hash da senha", async () => {
      mockedQuery.mockResolvedValue({
        rows: [{ password_hash: "hashed-password" }],
        rowCount: 1,
      } as any);

      const result = await UserRepository.getPasswordHash("user1");

      expect(result).toBe("hashed-password");
    });

    it("deve retornar null quando usuário não encontrado", async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await UserRepository.getPasswordHash("notfound");

      expect(result).toBeNull();
    });
  });

  describe("updateLastLogin", () => {
    it("deve atualizar último login com sucesso", async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 1,
      } as any);

      await expect(
        UserRepository.updateLastLogin("user1")
      ).resolves.not.toThrow();

      expect(mockedQuery).toHaveBeenCalledWith(
        "UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1",
        ["user1"]
      );
    });
  });

  describe("emailExists", () => {
    it("deve retornar true quando email existe", async () => {
      mockedQuery.mockResolvedValue({
        rows: [{ count: "1" }],
        rowCount: 1,
      } as any);

      const result = await UserRepository.emailExists("existing@test.com");

      expect(result).toBe(true);
    });

    it("deve retornar false quando email não existe", async () => {
      mockedQuery.mockResolvedValue({
        rows: [{ count: "0" }],
        rowCount: 1,
      } as any);

      const result = await UserRepository.emailExists("new@test.com");

      expect(result).toBe(false);
    });
  });
});

describe.skip("TenantRepository (extended)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("findById", () => {
    it("deve retornar tenant por ID", async () => {
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

    it("deve retornar null quando tenant não encontrado", async () => {
      mockedQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const result = await TenantRepository.findById("999");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("deve criar novo tenant", async () => {
      const tenantData: CreateTenantData = {
        name: "New Tenant",
        email: "newtenant@test.com",
        phone: "987654321",
        planType: "basic",
      };

      const mockCreatedTenant = {
        id: "new-tenant-id",
        name: tenantData.name,
        email: tenantData.email,
        phone: tenantData.phone,
        plan_type: tenantData.planType,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockedQuery.mockResolvedValue({
        rows: [mockCreatedTenant],
        rowCount: 1,
      } as any);

      const result = await TenantRepository.create(tenantData);

      expect(result).toBeDefined();
      expect(result.name).toBe(tenantData.name);
      expect(result.email).toBe(tenantData.email);
    });

    it("deve lançar erro em caso de falha", async () => {
      const tenantData: CreateTenantData = {
        name: "Failing Tenant",
        email: "fail@test.com",
        planType: "basic",
      };

      mockedQuery.mockRejectedValue(new Error("Database constraint error"));

      await expect(TenantRepository.create(tenantData)).rejects.toThrow(
        "Database constraint error"
      );
    });
  });
});
