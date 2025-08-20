# 🔧 CI/CD Setup Guide

Este guia te ajudará a configurar completamente o pipeline CI/CD do SAAS Personal Trainer.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

- [x] GitHub CLI instalado e autenticado (`gh auth login`)
- [x] Permissões de administrador no repositório
- [x] Acesso às configurações do repositório
- [x] Domínio configurado (se for fazer deploy real)

### Instalação dos Pré-requisitos

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install gh jq bc openssl yamllint

# macOS
brew install gh jq bc openssl yamllint

# Autenticação GitHub CLI
gh auth login
```

## 🚀 Configuração Rápida

Execute o script master de configuração:

```bash
./scripts/setup-cicd.sh
```

Este script oferece um menu interativo para configurar todos os componentes.

## 📋 Configuração Manual (Passo a Passo)

### 1. 🔐 Configurar GitHub Secrets

Execute o script de configuração de secrets:

```bash
./scripts/setup-github-secrets.sh
```

**Secrets Automáticos:**

- `POSTGRES_USER` - Usuário do banco de dados
- `POSTGRES_PASSWORD` - Senha do banco (gerada automaticamente)
- `POSTGRES_DB` - Nome do banco de dados
- `JWT_SECRET` - Chave JWT (gerada automaticamente)
- `JWT_REFRESH_SECRET` - Chave refresh token (gerada automaticamente)
- `CORS_ORIGIN` - URLs permitidas para CORS

**Secrets Manuais (você deve configurar):**

#### Slack Integration

1. Vá para o seu workspace do Slack
2. Crie um novo app em https://api.slack.com/apps
3. Adicione webhook incoming
4. Configure o secret:

```bash
gh secret set SLACK_WEBHOOK --body "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

#### Discord Integration

1. Vá para as configurações do seu servidor Discord
2. Integrações → Webhooks → Novo Webhook
3. Configure o secret:

```bash
gh secret set DISCORD_WEBHOOK --body "https://discord.com/api/webhooks/YOUR/WEBHOOK/URL"
```

#### Codecov Integration

1. Vá para https://codecov.io/
2. Faça login com GitHub
3. Adicione o repositório `ghutttyerrez/SAAS-Personal-Trainer`
4. Obtenha o token e configure:

```bash
gh secret set CODECOV_TOKEN --body "your-codecov-upload-token"
```

#### Grafana Password

```bash
gh secret set GRAFANA_PASSWORD --body "$(openssl rand -base64 24)"
```

### 2. 🛡️ Configurar Branch Protection

Execute o script de proteção de branches:

```bash
./scripts/setup-branch-protection.sh
```

**Regras Aplicadas:**

- Require pull request reviews (1 aprovador)
- Dismiss stale reviews on new commits
- Require status checks to pass
- Require conversation resolution
- Prevent force pushes and deletions
- Enforce for administrators

**Status Checks Obrigatórios:**

- `test (api)` - Testes da API devem passar
- `test (web)` - Testes do Web devem passar
- `security` - Scan de segurança deve passar
- `quality-gate` - Quality gate deve passar

### 3. 🌐 Atualizar URLs de Produção

Execute o script de atualização de URLs:

```bash
./scripts/update-production-urls.sh --interactive
```

**Informações Necessárias:**

- Domínio principal (ex: `myapp.com`)
- URL da API (ex: `api.myapp.com`)
- URL do Web (ex: `app.myapp.com`)
- Servidor SMTP (ex: `smtp.sendgrid.net`)
- Email remetente (ex: `noreply@myapp.com`)

**Arquivos Atualizados:**

- `.github/workflows/monitoring.yml`
- `.github/workflows/ci-cd.yml`
- `lighthouserc.js`
- `.env.*.example`
- `README.md`

### 4. 📊 Configurar Ambientes GitHub

Os ambientes são criados automaticamente pelos scripts, mas você pode configurar manualmente:

#### Staging Environment

1. Vá para: Settings → Environments → New environment
2. Nome: `staging`
3. Não adicione regras de proteção (deploy automático)

#### Production Environment

1. Vá para: Settings → Environments → New environment
2. Nome: `production`
3. Adicione regra: Require reviewers (você mesmo)
4. Wait timer: 0 minutos

## 🧪 Testando a Configuração

### Teste Local

```bash
# Verificar scripts
./scripts/setup-cicd.sh
# Escolha opção 7 (Test Configuration)

# Verificar sintaxe dos workflows
yamllint .github/workflows/*.yml

# Verificar Dockerfiles
docker build -t test-api ./apps/api
docker build -t test-web ./apps/web
```

### Teste de CI/CD

```bash
# Criar branch de teste
git checkout -b test-cicd

# Fazer uma pequena mudança
echo "# Test CI/CD" >> TEST.md
git add TEST.md
git commit -m "test: CI/CD pipeline"

# Push e criar PR
git push -u origin test-cicd
gh pr create --title "Test CI/CD Pipeline" --body "Testing automated workflows"
```

### Verificar Workflows

1. Vá para: https://github.com/ghutttyerrez/SAAS-Personal-Trainer/actions
2. Verifique se todos os workflows executam sem erro
3. Confirme que os quality gates funcionam

## 📊 Monitoramento

### Health Checks

O sistema faz verificações automáticas a cada 15 minutos:

- Status da API
- Status do Web App
- Performance metrics
- Database health

### Alerts

Configurados para notificar via:

- Slack (se configurado)
- Discord (se configurado)
- GitHub Issues (automático)

### Dashboards

- **GitHub Actions**: Histórico de builds e deploys
- **Codecov**: Relatórios de cobertura de testes
- **Grafana**: Métricas de performance (quando configurado)

## 🚨 Troubleshooting

### Erro: "GitHub CLI not authenticated"

```bash
gh auth login
gh auth refresh
```

### Erro: "Secrets não podem ser definidos"

Verifique se você tem permissões de administrador no repositório.

### Erro: "Workflow syntax invalid"

```bash
yamllint .github/workflows/*.yml
```

### Erro: "Docker build failed"

```bash
# Verificar logs
docker build --no-cache -t test ./apps/api

# Verificar dependências
cd apps/api && npm install
```

### Workflows não executam

1. Verifique se há workflows em `.github/workflows/`
2. Confirme que os triggers estão corretos
3. Verifique se há erros de sintaxe nos YAMLs

## 📋 Checklist de Configuração

### Básico

- [ ] GitHub CLI instalado e autenticado
- [ ] Repositório clonado localmente
- [ ] Scripts executáveis (`chmod +x scripts/*.sh`)

### Secrets

- [ ] Secrets básicos configurados (banco, JWT)
- [ ] SLACK_WEBHOOK configurado (opcional)
- [ ] DISCORD_WEBHOOK configurado (opcional)
- [ ] CODECOV_TOKEN configurado
- [ ] URLs de produção atualizadas

### Branch Protection

- [ ] Main branch protegida
- [ ] Status checks obrigatórios
- [ ] Reviews obrigatórias
- [ ] Force push desabilitado

### Ambientes

- [ ] Ambiente staging criado
- [ ] Ambiente production criado com proteção
- [ ] Variáveis de ambiente configuradas

### Workflows

- [ ] CI/CD workflow funcionando
- [ ] PR validation funcionando
- [ ] Coverage reporting funcionando
- [ ] Monitoring funcionando

### Testes

- [ ] Workflows testados com PR
- [ ] Quality gates validados
- [ ] Deploy automático testado
- [ ] Rollback testado

## 🎯 Próximos Passos

Após completar a configuração:

1. **Configure DNS e SSL**

   - Aponte seu domínio para os servidores
   - Configure certificados SSL

2. **Configure Infraestrutura Real**

   - Servidores de staging e produção
   - Bancos de dados
   - Redis/Cache

3. **Monitore o Primeiro Deploy**

   - Acompanhe os logs
   - Verifique health checks
   - Teste funcionalidades

4. **Documente Customizações**
   - Procedimentos específicos
   - Configurações de infraestrutura
   - Contatos de emergência

---

**Suporte**: Abra uma issue no repositório para suporte
**Documentação**: Veja `CI-CD-PIPELINE.md` para detalhes técnicos
