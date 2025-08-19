import pool from "../config/database";

export class ClientsRepository {
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
}
