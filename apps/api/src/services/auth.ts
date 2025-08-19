import bcrypt from "bcryptjs";
import { UserRepository, TenantRepository } from "../repositories/auth";
import { RefreshTokenRepository } from "../repositories/refreshToken";
import { generateToken } from "../middleware/auth";
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  Tenant,
} from "@personal-trainer/shared-types";

export class AuthService {
  // Login
  static async login(
    credentials: LoginCredentials
  ): Promise<
    (AuthResponse & { success: boolean }) | { success: false; message: string }
  > {
    try {
      const { email, password } = credentials;
      const user = await UserRepository.findByEmail(email);
      if (!user) {
        return { success: false, message: "Usuário não encontrado" };
      }
      const passwordHash = await UserRepository.getPasswordHash(user.id);
      if (!passwordHash) {
        return { success: false, message: "Senha não encontrada" };
      }
      const isPasswordValid = await bcrypt.compare(password, passwordHash);
      if (!isPasswordValid) {
        return { success: false, message: "Senha inválida" };
      }
      const tenant = await TenantRepository.findById(user.tenantId);
      if (!tenant) {
        return { success: false, message: "Tenant não encontrado" };
      }
      await UserRepository.updateLastLogin(user.id);
      const accessToken = generateToken(user, user.tenantId);
      const refreshToken = await RefreshTokenRepository.create(user.id);
      return {
        success: true,
        user,
        tenant,
        token: accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error("Erro no serviço de login:", error);
      return { success: false, message: "Erro interno no login" };
    }
  }

  // Registro
  static async register(
    data: RegisterData
  ): Promise<
    (AuthResponse & { success: boolean }) | { success: false; message: string }
  > {
    try {
      const { email, password, firstName, lastName, tenantName } = data;
      const emailExists = await UserRepository.emailExists(email);
      if (emailExists) {
        return { success: false, message: "Email já está em uso" };
      }
      const passwordHash = await bcrypt.hash(password, 12);
      let user: User;
      let tenant: Tenant;
      if (tenantName) {
        const result = await TenantRepository.createTenantWithUser(
          {
            name: tenantName,
            email,
            planType: "basic",
          },
          {
            email,
            passwordHash,
            firstName,
            lastName,
            role: "trainer",
          }
        );
        user = result.user;
        tenant = result.tenant;
      } else {
        return {
          success: false,
          message: "Nome do negócio é obrigatório para registro",
        };
      }
      const accessToken = generateToken(user, user.tenantId);
      const refreshToken = await RefreshTokenRepository.create(user.id);
      return {
        success: true,
        user,
        tenant,
        token: accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error("Erro no serviço de registro:", error);
      return { success: false, message: "Erro interno no registro" };
    }
  }

  // Refresh token
  static async refreshToken(token: string): Promise<{
    success: boolean;
    token?: string;
    refreshToken?: string;
    message?: string;
  }> {
    try {
      const refreshTokenData = await RefreshTokenRepository.verify(token);
      if (!refreshTokenData) {
        return { success: false, message: "Refresh token inválido" };
      }
      const user = await UserRepository.findById(refreshTokenData.userId);
      if (!user) {
        return { success: false, message: "Usuário não encontrado" };
      }
      await RefreshTokenRepository.revoke(token);
      const newAccessToken = generateToken(user, user.tenantId);
      const newRefreshToken = await RefreshTokenRepository.create(user.id);
      return {
        success: true,
        token: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      console.error("Erro no serviço de refresh token:", error);
      return { success: false, message: "Erro interno no refresh token" };
    }
  }
  // Perfil do usuário logado
  static async getUserProfile(
    user: User | undefined,
    tenantId: string | undefined
  ) {
    try {
      if (!user) {
        return { success: false, message: "Usuário não autenticado" };
      }
      if (!tenantId) {
        return { success: false, message: "TenantId não informado" };
      }
      const tenant = await TenantRepository.findById(tenantId);
      if (!tenant) {
        return { success: false, message: "Tenant não encontrado" };
      }
      return {
        success: true,
        user,
        tenant,
      };
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      return { success: false, message: "Erro interno ao buscar perfil" };
    }
  }

  // Logout
  static async logout(refreshToken: string): Promise<void> {
    try {
      await RefreshTokenRepository.revoke(refreshToken);
    } catch (error) {
      console.error("Erro no serviço de logout:", error);
      throw error;
    }
  }

  // Logout de todos os dispositivos
  static async logoutAll(userId: string): Promise<void> {
    try {
      await RefreshTokenRepository.revokeAllByUserId(userId);
    } catch (error) {
      console.error(
        "Erro no serviço de logout de todos os dispositivos:",
        error
      );
      throw error;
    }
  }

  // Verificar se usuário existe
  static async getUserById(userId: string): Promise<User | null> {
    try {
      return await UserRepository.findById(userId);
    } catch (error) {
      console.error("Erro ao buscar usuário por ID:", error);
      throw error;
    }
  }

  // Buscar tenant por ID
  static async getTenantById(tenantId: string): Promise<Tenant | null> {
    try {
      return await TenantRepository.findById(tenantId);
    } catch (error) {
      console.error("Erro ao buscar tenant por ID:", error);
      throw error;
    }
  }
}
