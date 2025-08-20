import { UserRepository, TenantRepository } from "../../repositories/auth";
import { query, transaction } from "../../config/database";

// Mock das funções do database
jest.mock("../../config/database", () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockTransaction = transaction as jest.MockedFunction<typeof transaction>;

describe("Auth Repositories", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("UserRepository", () => {
    describe("findByEmail", () => {
      it("deve encontrar usuário por email", async () => {
        const mockRow = {
          id: "user-1",
          tenant_id: "tenant-1",
          email: "test@example.com",
          first_name: "Test",
          last_name: "User",
          role: "trainer",
          is_active: true,
          last_login_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        };

        mockQuery.mockResolvedValue({
          rows: [mockRow],
          rowCount: 1,
        } as any);

        const result = await UserRepository.findByEmail("test@example.com");

        expect(result).toEqual({
          id: "user-1",
          tenantId: "tenant-1",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          role: "trainer",
          isActive: true,
          lastLoginAt: mockRow.last_login_at,
          createdAt: mockRow.created_at,
          updatedAt: mockRow.updated_at,
        });
        expect(mockQuery).toHaveBeenCalledWith(
          "SELECT * FROM users WHERE email = $1 AND is_active = true",
          ["test@example.com"]
        );
      });

      it("deve retornar null quando usuário não for encontrado", async () => {
        mockQuery.mockResolvedValue({
          rows: [],
          rowCount: 0,
        } as any);

        const result = await UserRepository.findByEmail("notfound@example.com");

        expect(result).toBeNull();
      });

      it("deve tratar erro de banco de dados", async () => {
        mockQuery.mockRejectedValue(new Error("Database error"));

        await expect(
          UserRepository.findByEmail("test@example.com")
        ).rejects.toThrow("Database error");
      });
    });

    describe("findById", () => {
      it("deve encontrar usuário por ID", async () => {
        const mockRow = {
          id: "user-1",
          tenant_id: "tenant-1",
          email: "test@example.com",
          first_name: "Test",
          last_name: "User",
          role: "trainer",
          is_active: true,
          last_login_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        };

        mockQuery.mockResolvedValue({
          rows: [mockRow],
          rowCount: 1,
        } as any);

        const result = await UserRepository.findById("user-1");

        expect(result).toEqual({
          id: "user-1",
          tenantId: "tenant-1",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          role: "trainer",
          isActive: true,
          lastLoginAt: mockRow.last_login_at,
          createdAt: mockRow.created_at,
          updatedAt: mockRow.updated_at,
        });
        expect(mockQuery).toHaveBeenCalledWith(
          "SELECT * FROM users WHERE id = $1 AND is_active = true",
          ["user-1"]
        );
      });

      it("deve retornar null quando usuário não for encontrado", async () => {
        mockQuery.mockResolvedValue({
          rows: [],
          rowCount: 0,
        } as any);

        const result = await UserRepository.findById("not-found");

        expect(result).toBeNull();
      });
    });

    describe("create", () => {
      it("deve criar novo usuário", async () => {
        const userData = {
          email: "new@example.com",
          passwordHash: "hashed-password",
          firstName: "New",
          lastName: "User",
          role: "trainer" as const,
          tenantId: "tenant-1",
        };

        const mockCreatedRow = {
          id: "user-2",
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

        mockQuery.mockResolvedValue({
          rows: [mockCreatedRow],
          rowCount: 1,
        } as any);

        const result = await UserRepository.create(userData);

        expect(result).toMatchObject({
          id: "user-2",
          tenantId: "tenant-1",
          email: "new@example.com",
          firstName: "New",
          lastName: "User",
          role: "trainer",
        });
        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining("INSERT INTO users"),
          expect.arrayContaining([
            expect.any(String), // id
            userData.tenantId,
            userData.email,
            userData.passwordHash,
            userData.firstName,
            userData.lastName,
            userData.role,
          ])
        );
      });

      it("deve tratar erro na criação", async () => {
        const userData = {
          email: "new@example.com",
          passwordHash: "hashed-password",
          firstName: "New",
          lastName: "User",
          role: "trainer" as const,
          tenantId: "tenant-1",
        };

        mockQuery.mockRejectedValue(new Error("Duplicate email"));

        await expect(UserRepository.create(userData)).rejects.toThrow(
          "Duplicate email"
        );
      });
    });

    describe("updateLastLogin", () => {
      it("deve atualizar o último login", async () => {
        mockQuery.mockResolvedValue({ rowCount: 1 } as any);
        await expect(
          UserRepository.updateLastLogin("user-1")
        ).resolves.toBeUndefined();
        expect(mockQuery).toHaveBeenCalledWith(
          "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1",
          ["user-1"]
        );
      });
    });

    describe("emailExists", () => {
      it("deve retornar true quando email existir", async () => {
        mockQuery.mockResolvedValue({ rows: [{ count: "1" }] } as any);
        await expect(UserRepository.emailExists("a@a.com")).resolves.toBe(true);
        expect(mockQuery).toHaveBeenCalledWith(
          "SELECT COUNT(*) as count FROM users WHERE email = $1",
          ["a@a.com"]
        );
      });
      it("deve retornar false quando email não existir", async () => {
        mockQuery.mockResolvedValue({ rows: [{ count: "0" }] } as any);
        await expect(UserRepository.emailExists("b@b.com")).resolves.toBe(
          false
        );
      });
    });
  });

  describe("TenantRepository", () => {
    describe("findById", () => {
      it("deve encontrar tenant por ID", async () => {
        const mockTenant = {
          id: "tenant-1",
          name: "Test Business",
          email: "t@t.com",
          phone: null,
          plan_type: "basic",
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        mockQuery.mockResolvedValue({
          rows: [mockTenant],
          rowCount: 1,
        } as any);

        const result = await TenantRepository.findById("tenant-1");

        expect(result).toEqual({
          id: mockTenant.id,
          name: mockTenant.name,
          email: mockTenant.email,
          phone: mockTenant.phone,
          planType: mockTenant.plan_type,
          isActive: mockTenant.is_active,
          createdAt: mockTenant.created_at,
          updatedAt: mockTenant.updated_at,
        });
        expect(mockQuery).toHaveBeenCalledWith(
          "SELECT * FROM tenants WHERE id = $1 AND is_active = true",
          ["tenant-1"]
        );
      });

      it("deve retornar null quando tenant não for encontrado", async () => {
        mockQuery.mockResolvedValue({
          rows: [],
          rowCount: 0,
        } as any);

        const result = await TenantRepository.findById("not-found");

        expect(result).toBeNull();
      });
    });

    describe("create", () => {
      it("deve criar novo tenant", async () => {
        const tenantData = {
          name: "New Business",
          email: "t@t.com",
          phone: undefined,
          planType: "basic" as const,
        };

        const mockCreatedTenant = {
          id: "tenant-2",
          name: "New Business",
          email: "t@t.com",
          phone: null,
          plan_type: "basic",
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        };

        mockQuery.mockResolvedValue({
          rows: [mockCreatedTenant],
          rowCount: 1,
        } as any);

        const result = await TenantRepository.create(tenantData);

        expect(result).toEqual({
          id: mockCreatedTenant.id,
          name: mockCreatedTenant.name,
          email: mockCreatedTenant.email,
          phone: mockCreatedTenant.phone,
          planType: mockCreatedTenant.plan_type,
          isActive: mockCreatedTenant.is_active,
          createdAt: mockCreatedTenant.created_at,
          updatedAt: mockCreatedTenant.updated_at,
        });
        expect(mockQuery).toHaveBeenCalledWith(
          expect.stringContaining("INSERT INTO tenants"),
          [
            expect.any(String),
            tenantData.name,
            tenantData.email,
            tenantData.phone,
            tenantData.planType,
          ]
        );
      });

      it("deve tratar erro na criação do tenant", async () => {
        const tenantData = {
          name: "New Business",
          email: "t@t.com",
          phone: undefined,
          planType: "basic" as const,
        };

        mockQuery.mockRejectedValue(new Error("Database constraint error"));

        await expect(TenantRepository.create(tenantData)).rejects.toThrow(
          "Database constraint error"
        );
      });
    });

    describe("createTenantWithUser (transação)", () => {
      it("deve criar tenant e usuário na transação", async () => {
        const fakeClient = { query: jest.fn() } as any;
        const tenantRow = {
          id: "tenant-10",
          name: "Biz",
          email: "biz@t.com",
          phone: null,
          plan_type: "basic",
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        };
        const userRow = {
          id: "user-10",
          tenant_id: "tenant-10",
          email: "u@t.com",
          first_name: "U",
          last_name: "S",
          role: "trainer",
          is_active: true,
          last_login_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
        // primeira query retorna tenant, segunda retorna user
        (fakeClient.query as jest.Mock).mockResolvedValueOnce({
          rows: [tenantRow],
        });
        (fakeClient.query as jest.Mock).mockResolvedValueOnce({
          rows: [userRow],
        });

        mockTransaction.mockImplementation(async (cb: any) => cb(fakeClient));

        const result = await TenantRepository.createTenantWithUser(
          { name: "Biz", email: "biz@t.com", planType: "basic" },
          {
            email: "u@t.com",
            passwordHash: "hash",
            firstName: "U",
            lastName: "S",
            role: "trainer",
          }
        );

        expect(result.tenant.id).toBe("tenant-10");
        expect(result.user.id).toBe("user-10");
        expect(fakeClient.query).toHaveBeenCalledTimes(2);
      });
    });
  });
});
