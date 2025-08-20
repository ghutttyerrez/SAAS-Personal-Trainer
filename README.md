# Personal Trainer SaaS

[![CI/CD Pipeline](https://github.com/ghutttyerrez/SAAS-Personal-Trainer/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/ghutttyerrez/SAAS-Personal-Trainer/actions/workflows/ci-cd.yml)
[![Test Coverage](https://codecov.io/gh/ghutttyerrez/SAAS-Personal-Trainer/branch/main/graph/badge.svg)](https://codecov.io/gh/ghutttyerrez/SAAS-Personal-Trainer)
[![Security Scan](https://github.com/ghutttyerrez/SAAS-Personal-Trainer/actions/workflows/security.yml/badge.svg)](https://github.com/ghutttyerrez/SAAS-Personal-Trainer/actions/workflows/security.yml)
[![Version: v1.0.0](https://img.shields.io/badge/Version-v1.0.0-blue.svg)](https://github.com/ghutttyerrez/SAAS-Personal-Trainer/releases)

Este é um monorepo contendo um aplicativo completo para Personal Trainers com versões web, mobile e API backend, implementando práticas modernas de CI/CD, testes automatizados e deploy containerizado.

## 🏗️ Estrutura do Projeto

```
├── .github/
│   └── workflows/        # GitHub Actions workflows
├── apps/
│   ├── web/             # Aplicação web React + TypeScript
│   ├── mobile/          # App mobile React Native + Expo + TypeScript
│   └── api/             # API backend Node.js + Express + TypeScript
├── packages/
│   └── shared-types/    # Tipos compartilhados TypeScript
├── scripts/
│   └── deploy.sh        # Scripts de deployment automatizado
└── docker-compose.*.yml # Configurações Docker para diferentes ambientes
```

## 🚀 Tecnologias Utilizadas

### Core Stack
- **Monorepo**: Turborepo
- **Frontend Web**: React, TypeScript, Recharts
- **Mobile**: React Native, Expo, EAS Build, TypeScript
- **Backend**: Node.js, Express, TypeScript, Socket.IO
- **Banco de Dados**: PostgreSQL (multi-tenant)
- **Autenticação**: JWT + Refresh Tokens
- **Validação**: Zod schemas
- **Testes**: Jest + Supertest + Coverage (>70%)

### DevOps & CI/CD
- **Containerização**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Registry**: GitHub Container Registry
- **Monitoramento**: Prometheus + Grafana
- **Security**: Trivy scanner, npm audit
- **Performance**: Lighthouse CI

### Quality Assurance
- **Test Coverage**: >70% minimum threshold
- **Code Quality**: ESLint + TypeScript strict mode
- **Security Scanning**: Automated vulnerability detection
- **Performance Monitoring**: Lighthouse audits + response time monitoring

## ✨ Funcionalidades

- 🔐 Sistema de autenticação e autorização
- 👥 Gerenciamento de clientes
- 💪 Criação e gestão de treinos
- 📊 Acompanhamento de progresso com gráficos
- 💬 Chat em tempo real
- 🏢 Arquitetura multi-tenant
- 🔄 CI/CD automatizado
- 📈 Monitoramento contínuo
- 🐳 Deploy containerizado
- ⚡ Performance otimizada

## 🛠️ Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Inicia todos os projetos em modo desenvolvimento
- `npm run build` - Faz build de todos os projetos
- `npm run lint` - Executa linting em todos os projetos
- `npm run type-check` - Verifica tipos TypeScript
- `npm run test` - Executa testes em todos os projetos
- `npm run test:coverage` - Executa testes com relatório de cobertura

### CI/CD e Deploy
- `npm run ci:check` - Executa validações completas (lint + tipos + testes)
- `npm run docker:build` - Constrói imagens Docker
- `npm run docker:dev` - Inicia ambiente Docker de desenvolvimento
- `npm run deploy:staging` - Deploy para ambiente de staging
- `npm run deploy:prod` - Deploy para produção

### Release
- `npm run release` - Cria uma release patch (x.x.X)
- `npm run release:minor` - Cria uma release minor (x.X.x)
- `npm run release:major` - Cria uma release major (X.x.x)

## 🚀 Como Iniciar

### Pré-requisitos
- Node.js 18+ 
- Docker + Docker Compose
- Git

### 1. Instale as dependências:

   ```bash
   git clone https://github.com/ghutttyerrez/SAAS-Personal-Trainer.git
   cd SAAS-Personal-Trainer
   npm install
   ```

### 2. Configure as variáveis de ambiente:

   ```bash
   # Copie os arquivos de exemplo
   cp .env.development.example .env.development
   cp .env.staging.example .env.staging
   cp .env.production.example .env.production
   
   # Edite os arquivos com suas configurações
   ```

### 3. Inicie o ambiente de desenvolvimento:

   ```bash
   # Opção 1: Desenvolvimento local
   npm run dev
   
   # Opção 2: Ambiente Docker completo
   npm run docker:dev
   ```

## 🐳 Deploy com Docker

### Desenvolvimento
```bash
# Iniciar ambiente completo
docker-compose -f docker-compose.dev.yml up -d

# Ver logs
docker-compose -f docker-compose.dev.yml logs -f

# Parar ambiente
docker-compose -f docker-compose.dev.yml down
```

### Staging/Produção
```bash
# Build das imagens
./scripts/deploy.sh staging v1.0.0 build

# Deploy completo
./scripts/deploy.sh staging v1.0.0

# Rollback se necessário
./scripts/deploy.sh staging v0.9.0 rollback
```

## 🔄 Pipeline CI/CD

O projeto implementa um pipeline robusto de CI/CD com:

### Continuous Integration (CI)
- ✅ Validação de código (lint + types)
- 🧪 Execução de testes automatizados
- 📊 Verificação de cobertura (>70%)
- 🔒 Scan de segurança (Trivy + npm audit)
- 🐳 Build de imagens Docker
- ⚡ Auditoria de performance (Lighthouse)

### Continuous Deployment (CD)
- 🚀 Deploy automatizado para staging
- 📋 Quality gates para produção
- 🔄 Rolling updates sem downtime
- 📈 Monitoramento pós-deploy
- 🚨 Alertas automáticos em caso de falha
- 📝 Documentação automática de releases

### Ambientes
- **Development**: Ambiente local Docker
- **Staging**: Pre-produção para testes
- **Production**: Ambiente live com monitoramento

## 📊 Monitoramento

### Health Checks
- API: `http://localhost:3001/api/health`
- Web: `http://localhost/health`
- Database: Verificação automática de conectividade

### Métricas Disponíveis
- Response time da API
- Uptime dos serviços
- Utilização de recursos
- Cobertura de testes
- Performance scores (Lighthouse)

### Alertas
- Slack/Discord notifications
- Issues automáticos no GitHub
- Dashboards Grafana + Prometheus

## 🔒 Segurança

- 🔐 JWT com refresh tokens
- 🛡️ Validação Zod em todas as rotas
- 🔍 Scan automático de vulnerabilidades
- 🔒 Headers de segurança (helmet)
- 📝 Audit logs automático
- 🚫 Rate limiting configurável

## 📈 Performance

- ⚡ Bundle optimization (React)
- 🗃️ Database indexing
- 🔄 Redis caching
- 📦 Gzip compression
- 🖼️ Image optimization
- 📱 Progressive Web App features

## 🧪 Testes

### Cobertura Atual
- **API**: >70% (linhas, funções, branches, statements)
- **Middleware**: 91% validation coverage
- **Routes**: 77% authentication coverage
- **Repositories**: 100% client operations

### Tipos de Teste
- **Unit Tests**: Lógica de negócio isolada
- **Integration Tests**: APIs e banco de dados
- **E2E Tests**: Fluxos completos de usuário
- **Performance Tests**: Load testing automatizado

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma feature branch (`git checkout -b feature/amazing-feature`)
3. Commit suas mudanças (`git commit -m 'Add amazing feature'`)
4. Push para a branch (`git push origin feature/amazing-feature`)
5. Abra um Pull Request

### Workflow de Desenvolvimento
1. Todas as mudanças devem passar no CI
2. Cobertura de testes deve ser mantida >70%
3. Code review obrigatório
4. Deploy automático após merge na main

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

- 📖 Documentação: [Wiki do projeto](https://github.com/ghutttyerrez/SAAS-Personal-Trainer/wiki)
- 🐛 Bugs: [Issues](https://github.com/ghutttyerrez/SAAS-Personal-Trainer/issues)
- 💬 Discussões: [Discussions](https://github.com/ghutttyerrez/SAAS-Personal-Trainer/discussions)

---

**Status do Projeto**: ✅ Em desenvolvimento ativo
**Próximas Features**: Progressive Web App, Notificações Push, Analytics Dashboard

2. Configure as variáveis de ambiente (veja .env.example em cada app)

3. Execute o projeto:
   ```bash
   npm run dev
   ```

## Arquitetura Multi-tenant

O sistema utiliza uma arquitetura multi-tenant onde cada Personal Trainer (tenant) tem seus dados isolados através de um `tenant_id` em todas as tabelas principais do banco de dados.
