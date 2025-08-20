# 🎯 GUIA PRÁTICO DE USO DIÁRIO DO CI/CD

## 🚀 1. CONFIGURAÇÃO INICIAL (EXECUTE APENAS UMA VEZ)

```bash
# 1. Autentique no GitHub CLI
gh auth login

# 2. Execute o script de configuração
./configure-cicd.sh
```

## 📋 2. FLUXO DE TRABALHO DIÁRIO

### 🔄 **Trabalhando com Features**

```bash
# 1. Criar nova branch para feature
git checkout -b feature/nome-da-feature

# 2. Fazer suas alterações
# ... code, code, code ...

# 3. Commit e push
git add .
git commit -m "feat: implementa nova funcionalidade X"
git push origin feature/nome-da-feature

# 4. Abrir Pull Request no GitHub
gh pr create --title "Feature: Nome da Feature" --body "Descrição da feature"
```

### ✅ **O que acontece automaticamente:**

1. **Quando você faz PUSH** → Executa testes
2. **Quando você abre PR** → Executa validação completa:

   - ✅ Lint do código
   - ✅ Testes unitários
   - ✅ Testes de integração
   - ✅ Verificação de segurança
   - ✅ Verificação de cobertura (mín 70%)
   - ✅ Build da aplicação

3. **Quando merge para `main`** → Deploy automático para staging
4. **Quando cria tag** → Deploy automático para produção

## 🎛️ 3. COMANDOS PRÁTICOS

### 📊 **Ver status dos workflows:**

```bash
gh run list --limit 10
```

### 🔍 **Ver detalhes de um workflow:**

```bash
gh run view <ID_DO_RUN>
```

### 🐳 **Ver imagens Docker criadas:**

```bash
gh api user/packages/container/saas-personal-trainer/versions
```

### 🚀 **Deploy manual para produção:**

```bash
# Criar tag para deploy
git tag v1.0.0
git push origin v1.0.0
```

## 🛠️ 4. ESTRUTURA DOS AMBIENTES

### 🧪 **Staging** (Automático após merge em main)

- **URL**: Configurada nos secrets
- **Dados**: Dados de teste
- **Atualização**: Automática a cada merge

### 🚀 **Produção** (Manual via tags)

- **URL**: Seu domínio real
- **Dados**: Dados reais
- **Atualização**: Manual via tags (v1.0.0, v1.1.0, etc.)

## 📈 5. MONITORAMENTO

### 📊 **Cobertura de Testes**

- **Mínimo**: 70%
- **Relatório**: https://codecov.io/
- **Status**: Visível no PR

### 🔒 **Segurança**

- **Scanner**: Trivy + npm audit
- **Relatórios**: GitHub Security tab

### 📱 **Notificações**

- **Slack**: Configure SLACK_WEBHOOK
- **Discord**: Configure DISCORD_WEBHOOK
- **Email**: Automático via GitHub

## 🚨 6. TROUBLESHOOTING

### ❌ **Build falhou?**

```bash
gh run view --log
```

### ❌ **Testes falharam?**

```bash
# Rodar localmente
npm test
npm run test:coverage
```

### ❌ **Deploy falhou?**

```bash
# Verificar logs
gh run view <ID> --log

# Verificar secrets
gh secret list
```

## 🎯 7. FLUXO COMPLETO DE EXEMPLO

```bash
# 1. Nova feature
git checkout -b feature/chat-real-time
# ... implementar feature ...
git add .
git commit -m "feat: adiciona chat em tempo real"
git push origin feature/chat-real-time

# 2. Abrir PR
gh pr create --title "Chat em Tempo Real" --body "Implementa chat WebSocket"

# 3. CI/CD executa automaticamente:
#    ✅ Testes passaram
#    ✅ Cobertura 75%
#    ✅ Segurança OK
#    ✅ Build OK

# 4. Merge PR
gh pr merge --merge

# 5. Deploy automático para staging!

# 6. Testar em staging, se OK:
git tag v1.2.0
git push origin v1.2.0

# 7. Deploy automático para produção! 🚀
```

## 🎉 PRONTO!

Agora você tem um pipeline completo que:

- ✅ Testa automaticamente
- ✅ Verifica qualidade do código
- ✅ Faz deploy automático
- ✅ Monitora aplicação
- ✅ Notifica problemas
- ✅ Mantém histórico completo
