import dotenv from "dotenv";

// Carrega variáveis de ambiente para testes
dotenv.config({ path: ".env.test" });

// Configurações globais para testes
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key";
process.env.JWT_REFRESH_SECRET = "test-jwt-refresh-secret-key";
process.env.PORT = "3002"; // Porta diferente para testes
