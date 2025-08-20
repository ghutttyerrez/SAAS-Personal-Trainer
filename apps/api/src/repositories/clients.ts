import pool, { transaction } from "../config/database";

type ClientUpdatableFields = {
  date_of_birth?: string | null;
  gender?: "male" | "female" | "other" | null;
  height?: number | null;
  weight?: number | null;
  fitness_goal?: string | null;
  medical_conditions?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relationship?: string | null;
  is_active?: boolean | null;
};

export class ClientsRepository {
  static async list(
    tenantId: string,
    page = 1,
    limit = 10
  ): Promise<{ rows: any[]; total: number; page: number; limit: number }> {
    const offset = (page - 1) * limit;
    const listQuery = `
      SELECT *
      FROM clients
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const countQuery = `SELECT COUNT(*)::int AS count FROM clients WHERE tenant_id = $1`;
    const [listRes, countRes] = await Promise.all([
      pool.query(listQuery, [tenantId, limit, offset]),
      pool.query(countQuery, [tenantId]),
    ]);
    return {
      rows: listRes.rows,
      total: countRes.rows[0]?.count ?? 0,
      page,
      limit,
    };
  }

  static async findById(id: string, tenantId: string): Promise<any | null> {
    const res = await pool.query(
      `SELECT * FROM clients WHERE id = $1 AND tenant_id = $2 LIMIT 1`,
      [id, tenantId]
    );
    return res.rows[0] ?? null;
  }

  static async create(
    tenantId: string,
    userId: string,
    data: ClientUpdatableFields
  ): Promise<any> {
    const fields: string[] = ["tenant_id", "user_id", ...Object.keys(data)];
    const values = [tenantId, userId, ...Object.values(data)];
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(", ");
    const query = `INSERT INTO clients (${fields.join(
      ", "
    )}) VALUES (${placeholders}) RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async update(
    id: string,
    tenantId: string,
    data: ClientUpdatableFields
  ): Promise<any | null> {
    const entries = Object.entries(data).filter(([, v]) => v !== undefined);
    if (entries.length === 0) {
      const current = await this.findById(id, tenantId);
      return current;
    }
    const setFragments = entries.map(([k], idx) => `${k} = $${idx + 1}`);
    const values = entries.map(([, v]) => v);
    values.push(id, tenantId);
    const queryText = `UPDATE clients SET ${setFragments.join(
      ", "
    )} WHERE id = $${entries.length + 1} AND tenant_id = $${
      entries.length + 2
    } RETURNING *`;
    const res = await pool.query(queryText, values);
    return res.rows[0] ?? null;
  }

  static async deactivateClient(
    clientId: string,
    tenantId: string
  ): Promise<boolean> {
    const result = await pool.query(
      "UPDATE clients SET is_active = false WHERE id = $1 AND tenant_id = $2",
      [clientId, tenantId]
    );
    return !!result && !!result.rowCount && result.rowCount > 0;
  }

  static async createUserAndClient(
    tenantId: string,
    user: {
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
      role?: "client" | "trainer" | "admin";
    },
    client: ClientUpdatableFields
  ): Promise<{ user: any; client: any }> {
    return await transaction(async (clientConn) => {
      const userResult = await clientConn.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          tenantId,
          user.email,
          user.passwordHash,
          user.firstName,
          user.lastName,
          user.role || "client",
        ]
      );

      const newUser = userResult.rows[0];

      const clientFields = ["tenant_id", "user_id", ...Object.keys(client)];
      const clientValues = [tenantId, newUser.id, ...Object.values(client)];
      const placeholders = clientFields.map((_, i) => `$${i + 1}`).join(", ");
      const insertClientQuery = `INSERT INTO clients (${clientFields.join(
        ", "
      )}) VALUES (${placeholders}) RETURNING *`;
      const createdClientRes = await clientConn.query(
        insertClientQuery,
        clientValues
      );

      return { user: newUser, client: createdClientRes.rows[0] };
    });
  }
}
