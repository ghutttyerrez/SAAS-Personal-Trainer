import { query, transaction } from "../config/database";
import { User, Tenant } from "@personal-trainer/shared-types";
import { v4 as uuidv4 } from "uuid";

export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: "admin" | "trainer" | "client";
  tenantId: string;
}

export interface CreateTenantData {
  name: string;
  email: string;
  phone?: string;
  planType: "basic" | "premium" | "enterprise";
}

export class UserRepository {
  // Buscar usuário por email
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await query(
        "SELECT * FROM users WHERE email = $1 AND is_active = true",
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        tenantId: row.tenant_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role,
        isActive: row.is_active,
        lastLoginAt: row.last_login_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error("Erro ao buscar usuário por email:", error);
      throw error;
    }
  }

  // Buscar usuário por ID
  static async findById(id: string): Promise<User | null> {
    try {
      const result = await query(
        "SELECT * FROM users WHERE id = $1 AND is_active = true",
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        tenantId: row.tenant_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role,
        isActive: row.is_active,
        lastLoginAt: row.last_login_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error("Erro ao buscar usuário por ID:", error);
      throw error;
    }
  }

  // Buscar hash da senha
  static async getPasswordHash(userId: string): Promise<string | null> {
    try {
      const result = await query(
        "SELECT password_hash FROM users WHERE id = $1",
        [userId]
      );

      return result.rows.length > 0 ? result.rows[0].password_hash : null;
    } catch (error) {
      console.error("Erro ao buscar hash da senha:", error);
      throw error;
    }
  }

  // Criar usuário
  static async create(userData: CreateUserData): Promise<User> {
    try {
      const id = uuidv4();
      const result = await query(
        `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          id,
          userData.tenantId,
          userData.email,
          userData.passwordHash,
          userData.firstName,
          userData.lastName,
          userData.role,
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        tenantId: row.tenant_id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        role: row.role,
        isActive: row.is_active,
        lastLoginAt: row.last_login_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw error;
    }
  }

  // Atualizar último login
  static async updateLastLogin(userId: string): Promise<void> {
    try {
      await query(
        "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1",
        [userId]
      );
    } catch (error) {
      console.error("Erro ao atualizar último login:", error);
      throw error;
    }
  }

  // Verificar se email já existe
  static async emailExists(email: string): Promise<boolean> {
    try {
      const result = await query(
        "SELECT COUNT(*) as count FROM users WHERE email = $1",
        [email]
      );

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error("Erro ao verificar se email existe:", error);
      throw error;
    }
  }
}

export class TenantRepository {
  // Buscar tenant por ID
  static async findById(id: string): Promise<Tenant | null> {
    try {
      const result = await query(
        "SELECT * FROM tenants WHERE id = $1 AND is_active = true",
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        planType: row.plan_type,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error("Erro ao buscar tenant por ID:", error);
      throw error;
    }
  }

  // Criar tenant
  static async create(tenantData: CreateTenantData): Promise<Tenant> {
    try {
      const id = uuidv4();
      const result = await query(
        `INSERT INTO tenants (id, name, email, phone, plan_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          id,
          tenantData.name,
          tenantData.email,
          tenantData.phone,
          tenantData.planType,
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        planType: row.plan_type,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error("Erro ao criar tenant:", error);
      throw error;
    }
  }

  // Criar tenant e usuário em transação
  static async createTenantWithUser(
    tenantData: CreateTenantData,
    userData: Omit<CreateUserData, "tenantId">
  ): Promise<{ tenant: Tenant; user: User }> {
    return await transaction(async (client) => {
      // Criar tenant
      const tenantId = uuidv4();
      const tenantResult = await client.query(
        `INSERT INTO tenants (id, name, email, phone, plan_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          tenantId,
          tenantData.name,
          tenantData.email,
          tenantData.phone,
          tenantData.planType,
        ]
      );

      // Criar usuário
      const userId = uuidv4();
      const userResult = await client.query(
        `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          userId,
          tenantId,
          userData.email,
          userData.passwordHash,
          userData.firstName,
          userData.lastName,
          userData.role,
        ]
      );

      const tenantRow = tenantResult.rows[0];
      const userRow = userResult.rows[0];

      return {
        tenant: {
          id: tenantRow.id,
          name: tenantRow.name,
          email: tenantRow.email,
          phone: tenantRow.phone,
          planType: tenantRow.plan_type,
          isActive: tenantRow.is_active,
          createdAt: tenantRow.created_at,
          updatedAt: tenantRow.updated_at,
        },
        user: {
          id: userRow.id,
          tenantId: userRow.tenant_id,
          email: userRow.email,
          firstName: userRow.first_name,
          lastName: userRow.last_name,
          role: userRow.role,
          isActive: userRow.is_active,
          lastLoginAt: userRow.last_login_at,
          createdAt: userRow.created_at,
          updatedAt: userRow.updated_at,
        },
      };
    });
  }
}
