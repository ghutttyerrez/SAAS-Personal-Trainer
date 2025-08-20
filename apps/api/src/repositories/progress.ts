import { transaction, query } from "../config/database";
import { ProgressLog } from "@personal-trainer/shared-types";
import { v4 as uuidv4 } from "uuid";

export class ProgressRepository {
  static async create(
    clientId: string,
    tenantId: string,
    logData: Omit<ProgressLog, "id" | "createdAt" | "updatedAt" | "clientId">
  ): Promise<ProgressLog> {
    const { date, weight, bodyFat, muscleMass, measurements, photos, notes } =
      logData;

    // Validação para garantir que o cliente pertence ao tenant
    const clientCheck = await query(
      "SELECT id FROM clients WHERE id = $1 AND tenant_id = $2",
      [clientId, tenantId]
    );
    if (clientCheck.rows.length === 0) {
      throw new Error("Cliente não encontrado ou não pertence ao tenant.");
    }

    const logId = uuidv4();
    const result = await query(
      `INSERT INTO progress_logs (id, client_id, date, weight, body_fat, muscle_mass, chest_measurement, waist_measurement, hips_measurement, bicep_measurement, thigh_measurement, photos, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        logId,
        clientId,
        date,
        weight,
        bodyFat,
        muscleMass,
        measurements?.chest,
        measurements?.waist,
        measurements?.hips,
        measurements?.bicep,
        measurements?.thigh,
        photos,
        notes,
      ]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      clientId: row.client_id,
      date: row.date,
      weight: row.weight,
      bodyFat: row.body_fat,
      muscleMass: row.muscle_mass,
      measurements: {
        chest: row.chest_measurement,
        waist: row.waist_measurement,
        hips: row.hips_measurement,
        bicep: row.bicep_measurement,
        thigh: row.thigh_measurement,
      },
      photos: row.photos,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static async findByClient(
    clientId: string,
    tenantId: string
  ): Promise<ProgressLog[]> {
    // Validação para garantir que o cliente pertence ao tenant
    const clientCheck = await query(
      "SELECT id FROM clients WHERE id = $1 AND tenant_id = $2",
      [clientId, tenantId]
    );
    if (clientCheck.rows.length === 0) {
      throw new Error("Cliente não encontrado ou não pertence ao tenant.");
    }

    const result = await query(
      "SELECT * FROM progress_logs WHERE client_id = $1 ORDER BY date DESC",
      [clientId]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      clientId: row.client_id,
      date: row.date,
      weight: row.weight,
      bodyFat: row.body_fat,
      muscleMass: row.muscle_mass,
      measurements: {
        chest: row.chest_measurement,
        waist: row.waist_measurement,
        hips: row.hips_measurement,
        bicep: row.bicep_measurement,
        thigh: row.thigh_measurement,
      },
      photos: row.photos,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  static async delete(logId: string, tenantId: string): Promise<boolean> {
    // A remoção precisa de um join para garantir o tenant
    const result = await query(
      `DELETE FROM progress_logs pl
       USING clients c
       WHERE pl.id = $1 AND pl.client_id = c.id AND c.tenant_id = $2`,
      [logId, tenantId]
    );
    return result.rowCount > 0;
  }
}
