# Personal Trainer SaaS

Este é um monorepo contendo um aplicativo completo para Personal Trainers com versões web, mobile e API backend.

## Estrutura do Projeto

```
├── apps/
│   ├── web/          # Aplicação web React + TypeScript
│   ├── mobile/       # App mobile React Native + Expo + TypeScript
│   └── api/          # API backend Node.js + Express + TypeScript
└── packages/
    └── shared-types/ # Tipos compartilhados TypeScript
```

## Tecnologias Utilizadas

- **Monorepo**: Turborepo
- **Frontend Web**: React, TypeScript, Recharts
- **Mobile**: React Native, Expo, EAS Build, TypeScript
- **Backend**: Node.js, Express, TypeScript, Socket.IO
- **Banco de Dados**: PostgreSQL (multi-tenant)
- **Autenticação**: JWT

## Funcionalidades

- 🔐 Sistema de autenticação e autorização
- 👥 Gerenciamento de clientes
- 💪 Criação e gestão de treinos
- 📊 Acompanhamento de progresso com gráficos
- 💬 Chat em tempo real
- 🏢 Arquitetura multi-tenant

## Scripts Disponíveis

- `npm run dev` - Inicia todos os projetos em modo desenvolvimento
- `npm run build` - Faz build de todos os projetos
- `npm run lint` - Executa linting em todos os projetos
- `npm run type-check` - Verifica tipos TypeScript

## Como Iniciar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente (veja .env.example em cada app)

3. Execute o projeto:
   ```bash
   npm run dev
   ```

## Arquitetura Multi-tenant

O sistema utiliza uma arquitetura multi-tenant onde cada Personal Trainer (tenant) tem seus dados isolados através de um `tenant_id` em todas as tabelas principais do banco de dados.
