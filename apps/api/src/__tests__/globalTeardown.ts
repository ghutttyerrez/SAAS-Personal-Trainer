export default async () => {
  console.log("🧹 Limpando ambiente de testes...");

  // Cleanup de recursos se necessário
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log("✅ Ambiente de testes limpo");
};
