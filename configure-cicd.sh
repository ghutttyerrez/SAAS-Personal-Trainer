#!/bin/bash

# ==========================================
# Configuração Prática CI/CD
# ==========================================

set -e

echo "🚀 Configurando CI/CD do SAAS Personal Trainer"
echo "=============================================="

# 1. Verificar se GitHub CLI está autenticado
echo "1️⃣ Verificando GitHub CLI..."
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI não autenticado. Execute:"
    echo "   gh auth login"
    exit 1
fi
echo "✅ GitHub CLI autenticado!"

# 2. Configurar secrets básicos
echo "2️⃣ Configurando secrets..."
gh secret set JWT_SECRET --body "$(openssl rand -base64 64)"
gh secret set JWT_REFRESH_SECRET --body "$(openssl rand -base64 64)"
gh secret set REGISTRY --body "ghcr.io"
gh secret set IMAGE_NAME --body "saas-personal-trainer"
gh secret set CORS_ORIGIN --body "http://localhost:3000,https://yourapp.com"
gh secret set SMTP_HOST --body "smtp.gmail.com"
gh secret set SMTP_USER --body "your-email@gmail.com"
gh secret set SMTP_PASS --body "your-app-password"
gh secret set WEBHOOK_SECRET --body "$(openssl rand -base64 32)"
echo "✅ Secrets básicos configurados!"

# 3. Criar environments
echo "3️⃣ Criando environments..."
gh api repos/ghutttyerrez/SAAS-Personal-Trainer/environments/staging --method PUT --field wait_timer=0 || true
gh api repos/ghutttyerrez/SAAS-Personal-Trainer/environments/production --method PUT --field wait_timer=0 || true
echo "✅ Environments criados!"

echo ""
echo "🎉 CONFIGURAÇÃO BÁSICA CONCLUÍDA!"
echo ""
echo "📋 PRÓXIMOS PASSOS MANUAIS:"
echo "1. Configure CODECOV_TOKEN em: https://codecov.io/"
echo "2. Configure SLACK_WEBHOOK se quiser notificações"
echo "3. Configure DISCORD_WEBHOOK se quiser notificações"
echo "4. Atualize seu domínio real no CORS_ORIGIN"
echo "5. Configure SMTP real para emails de produção"
echo ""
echo "🚀 AGORA VOCÊ JÁ PODE USAR O CI/CD!"
