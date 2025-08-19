import express from "express";
import request from "supertest";
import { AuthService } from "../services/auth";

export class TestUtils {
  /**
   * Cria um usuário de teste e retorna o token
   */
  static async createTestUser(
    app: express.Application,
    userData?: {
      name?: string;
      email?: string;
      password?: string;
      tenant_name?: string;
    }
  ) {
    const defaultData = {
      name: "Test User",
      email: `test${Date.now()}@example.com`,
      password: "test123456",
      tenant_name: "Test Tenant",
    };

    const data = { ...defaultData, ...userData };

    const response = await request(app).post("/api/auth/register").send(data);

    if (!response.body.success) {
      throw new Error(`Failed to create test user: ${response.body.message}`);
    }

    return {
      user: response.body.data.user,
      tenant: response.body.data.tenant,
      token: response.body.data.token,
      refreshToken: response.body.data.refreshToken,
    };
  }

  /**
   * Faz login com um usuário existente
   */
  static async loginUser(
    app: express.Application,
    email: string,
    password: string
  ) {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email, password });

    if (!response.body.success) {
      throw new Error(`Failed to login: ${response.body.message}`);
    }

    return {
      token: response.body.data.token,
      refreshToken: response.body.data.refreshToken,
      user: response.body.data.user,
    };
  }

  /**
   * Cria um cliente de teste para o tenant
   */
  static async createTestClient(
    app: express.Application,
    token: string,
    clientData?: {
      name?: string;
      email?: string;
      phone?: string;
    }
  ) {
    const defaultData = {
      name: "Test Client",
      email: `client${Date.now()}@example.com`,
      phone: "(11) 99999-9999",
    };

    const data = { ...defaultData, ...clientData };

    const response = await request(app)
      .post("/api/dev/create-client")
      .set("Authorization", `Bearer ${token}`)
      .send(data);

    if (!response.body.success) {
      throw new Error(`Failed to create test client: ${response.body.message}`);
    }

    return response.body.data;
  }

  /**
   * Gera dados de teste aleatórios
   */
  static generateRandomData() {
    const timestamp = Date.now();
    return {
      email: `test${timestamp}@example.com`,
      name: `Test User ${timestamp}`,
      tenantName: `Test Tenant ${timestamp}`,
      clientName: `Test Client ${timestamp}`,
    };
  }

  /**
   * Helper para requests autenticados
   */
  static authenticatedRequest(app: express.Application, token: string) {
    return {
      get: (url: string) =>
        request(app).get(url).set("Authorization", `Bearer ${token}`),
      post: (url: string) =>
        request(app).post(url).set("Authorization", `Bearer ${token}`),
      put: (url: string) =>
        request(app).put(url).set("Authorization", `Bearer ${token}`),
      delete: (url: string) =>
        request(app).delete(url).set("Authorization", `Bearer ${token}`),
      patch: (url: string) =>
        request(app).patch(url).set("Authorization", `Bearer ${token}`),
    };
  }

  /**
   * Aguarda um tempo específico
   */
  static async wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
