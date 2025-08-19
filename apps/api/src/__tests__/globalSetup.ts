export default async () => {
  console.log("🧪 Configurando ambiente de testes...");

  // Configurações específicas para testes
  process.env.NODE_ENV = "test";
  process.env.PORT = "3002";

  // Aguarda um pouco para garantir que tudo está configurado
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("✅ Ambiente de testes configurado");
};
