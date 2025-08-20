import { Pool } from "pg";

/**
 * Mock factory para simular queries de banco de dados
 */
export class DatabaseMockFactory {
  static createMockPool() {
    const mockPool = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    } as unknown as Pool;

    return mockPool;
  }

  /**
   * Mock para resultado de SELECT com múltiplas linhas
   */
  static mockSelectResult(rows: any[]) {
    return {
      rows,
      rowCount: rows.length,
      command: "SELECT",
      oid: 0,
      fields: [],
    };
  }

  /**
   * Mock para resultado de INSERT/UPDATE
   */
  static mockInsertResult(affectedRows = 1) {
    return {
      rows: [],
      rowCount: affectedRows,
      command: "INSERT",
      oid: 0,
      fields: [],
    };
  }

  /**
   * Mock para erro de banco
   */
  static mockDatabaseError(message = "Database error") {
    const error = new Error(message);
    (error as any).code = "23505"; // Unique violation
    return error;
  }

  /**
   * Mock de dados de usuário
   */
  static mockUser(overrides: Partial<any> = {}) {
    return {
      id: "user-123",
      name: "Test User",
      email: "test@example.com",
      tenant_id: "tenant-123",
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    };
  }

  /**
   * Mock de dados de tenant
   */
  static mockTenant(overrides: Partial<any> = {}) {
    return {
      id: "tenant-123",
      name: "Test Tenant",
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    };
  }

  /**
   * Mock de dados de cliente
   */
  static mockClient(overrides: Partial<any> = {}) {
    return {
      id: "client-123",
      name: "Test Client",
      email: "client@example.com",
      phone: "(11) 99999-9999",
      tenant_id: "tenant-123",
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    };
  }

  /**
   * Mock de dados de workout
   */
  static mockWorkout(overrides: Partial<any> = {}) {
    return {
      id: "workout-123",
      client_id: "client-123",
      name: "Test Workout",
      description: "Test workout description",
      tenant_id: "tenant-123",
      scheduled_date: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    };
  }
}
