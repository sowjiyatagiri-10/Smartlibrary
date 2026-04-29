#!/usr/bin/env bash

# 🚀 SMART LIBRARY - AUTOMATED DEPLOYMENT SCRIPT
# Framework: Node.js + Express.js
# Database: SQLite (sql.js)
# Frontend: Vanilla HTML5/CSS/JS
# 
# Usage: bash deploy.sh [render|vercel|heroku|github-pages]

set -e

PROJECT_NAME="Smart Library Management System"
REPO_URL="https://github.com/sowjiyatagiri-10/Smartlibrary"
GITHUB_USER="sowjiyatagiri-10"
GITHUB_REPO="Smartlibrary"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
}

print_step() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

check_requirements() {
    print_header "📋 Checking Requirements"
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Install from https://nodejs.org"
        exit 1
    fi
    print_step "Node.js: $(node --version)"
    
    if ! command -v npm &> /dev/null; then
        print_error "npm not found"
        exit 1
    fi
    print_step "npm: $(npm --version)"
    
    if ! command -v git &> /dev/null; then
        print_error "Git not found"
        exit 1
    fi
    print_step "Git: $(git --version | head -1)"
}

setup_dependencies() {
    print_header "📦 Installing Dependencies"
    
    if [ ! -d "node_modules" ]; then
        print_info "Installing npm packages..."
        npm install
        print_step "Dependencies installed"
    else
        print_step "Dependencies already installed"
    fi
}

check_env_file() {
    print_header "🔐 Checking Environment Configuration"
    
    if [ -f "backend/.env" ]; then
        print_step "backend/.env found"
    else
        print_error "backend/.env not found"
        print_info "Creating from template..."
        if [ -f "backend/.env.example" ]; then
            cp backend/.env.example backend/.env
            print_step "Created backend/.env from template"
        fi
    fi
}

test_local() {
    print_header "🧪 Testing Local Setup"
    
    print_info "Checking if port 3000 is available..."
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        print_error "Port 3000 already in use"
        print_info "Run: npx kill-port 3000"
        exit 1
    fi
    print_step "Port 3000 is available"
    
    print_info "Starting server..."
    timeout 10 npm start &
    sleep 3
    
    print_info "Testing API health..."
    if curl -s https://web-production-d5180.up.railway.app/api/health | grep -q "healthy"; then
        print_step "API is healthy"
    else
        print_error "API health check failed"
    fi
    
    jobs -p | xargs -r kill 2>/dev/null || true
}

deploy_to_render() {
    print_header "🚀 Deploy to Render"
    
    if ! command -v render &> /dev/null; then
        print_info "Installing Render CLI..."
        npm install -g @render/cli
    fi
    
    print_info "Render deployment steps:"
    echo "
    1. Go to: https://dashboard.render.com
    2. Click: New → Web Service
    3. Connect repository: ${GITHUB_USER}/${GITHUB_REPO}
    4. Configure:
       - Name: smart-library-api
       - Build Command: npm install
       - Start Command: npm start
    5. Set Environment Variables:
       PORT=3000
       NODE_ENV=production
       SESSION_SECRET=[auto-generated]
       FRONTEND_URL=https://smart-library-frontend.vercel.app
    6. Click Deploy
    
    Result: https://smart-library-api.onrender.com
    "
    
    print_step "Manual deployment required"
    print_info "Render dashboard: https://dashboard.render.com"
}

deploy_to_vercel() {
    print_header "🎨 Deploy to Vercel"
    
    if ! command -v vercel &> /dev/null; then
        print_info "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    print_info "Vercel deployment steps:"
    echo "
    1. Go to: https://vercel.com
    2. Click: Add New → Project
    3. Select repository: ${GITHUB_USER}/${GITHUB_REPO}
    4. Configure:
       - Framework: Other
       - Root Directory: .
       - Output Directory: frontend
    5. Set Environment Variables:
       VITE_API_URL=https://smart-library-api.onrender.com
    6. Click Deploy
    
    Result: https://smart-library-frontend.vercel.app
    "
    
    print_step "Manual deployment required"
    print_info "Vercel dashboard: https://vercel.com"
}

deploy_to_heroku() {
    print_header "🚀 Deploy to Heroku"
    
    if ! command -v heroku &> /dev/null; then
        print_info "Installing Heroku CLI..."
        npm install -g heroku
    fi
    
    print_info "Logging into Heroku..."
    heroku login
    
    print_info "Creating Heroku app..."
    APP_NAME="smart-library-api-$(date +%s)"
    heroku create "$APP_NAME"
    
    print_info "Setting environment variables..."
    heroku config:set PORT=3000
    heroku config:set NODE_ENV=production
    heroku config:set SESSION_SECRET="$(openssl rand -base64 32)"
    
    print_info "Deploying..."
    git push heroku main
    
    print_step "Deployed to Heroku"
    echo "URL: https://${APP_NAME}.herokuapp.com"
}

deploy_to_github_pages() {
    print_header "📄 Deploy to GitHub Pages (Frontend Only)"
    
    print_info "Creating gh-pages branch..."
    
    if git rev-parse --verify gh-pages >/dev/null 2>&1; then
        print_info "gh-pages branch already exists"
        git checkout gh-pages
    else
        git checkout --orphan gh-pages
        git rm -rf .
    fi
    
    print_info "Copying frontend files..."
    git checkout main -- frontend
    mv frontend/* .
    rmdir frontend
    
    print_info "Committing changes..."
    git add .
    git commit -m "Deploy frontend to GitHub Pages"
    
    print_info "Pushing to GitHub..."
    git push origin gh-pages
    
    print_step "Deployed to GitHub Pages"
    echo "URL: https://${GITHUB_USER}.github.io/${GITHUB_REPO}"
    
    print_info "Enabling GitHub Pages:"
    echo "  1. Go to: https://github.com/${GITHUB_USER}/${GITHUB_REPO}/settings/pages"
    echo "  2. Source: Deploy from a branch"
    echo "  3. Branch: gh-pages"
    
    git checkout main
}

git_cleanup() {
    print_header "🧹 Git Cleanup"
    
    print_info "Removing extraneous packages from git..."
    npm prune --production
    
    print_info "Committing changes..."
    git add .
    git commit -m "Clean up dependencies and prepare for production" || true
    
    print_info "Pushing to GitHub..."
    git push origin main
    
    print_step "Repository cleaned"
}

show_summary() {
    print_header "📊 DEPLOYMENT SUMMARY"
    
    echo "
    ${GREEN}Project:${NC} ${PROJECT_NAME}
    ${GREEN}Repository:${NC} ${REPO_URL}
    ${GREEN}Tech Stack:${NC} Node.js + Express.js + SQLite
    
    ${BLUE}Deployment Options:${NC}
    1. Render (Backend) → https://smart-library-api.onrender.com
    2. Vercel (Frontend) → https://smart-library-frontend.vercel.app
    3. Heroku (All-in-one) → https://smart-library-api-xxxxx.herokuapp.com
    4. GitHub Pages (Frontend only) → https://${GITHUB_USER}.github.io/${GITHUB_REPO}
    
    ${YELLOW}Recommended:${NC} Render (Backend) + Vercel (Frontend)
    
    ${GREEN}Next Steps:${NC}
    1. Run locally: npm run dev
    2. Test login with: Register ID = AN
    3. Push to GitHub: git push origin main
    4. Deploy backend to Render
    5. Deploy frontend to Vercel
    "
}

# Main
main() {
    TARGET="${1:-help}"
    
    case "$TARGET" in
        help)
            echo "Usage: bash deploy.sh [render|vercel|heroku|github-pages|setup|test|all]"
            ;;
        render)
            check_requirements
            git_cleanup
            deploy_to_render
            ;;
        vercel)
            check_requirements
            git_cleanup
            deploy_to_vercel
            ;;
        heroku)
            check_requirements
            setup_dependencies
            git_cleanup
            deploy_to_heroku
            ;;
        github-pages)
            check_requirements
            deploy_to_github_pages
            ;;
        setup)
            check_requirements
            setup_dependencies
            check_env_file
            print_step "Setup complete!"
            ;;
        test)
            check_requirements
            setup_dependencies
            check_env_file
            test_local
            ;;
        all)
            check_requirements
            setup_dependencies
            check_env_file
            test_local
            git_cleanup
            show_summary
            ;;
        *)
            print_error "Unknown target: $TARGET"
            echo "Usage: bash deploy.sh [render|vercel|heroku|github-pages|setup|test|all]"
            exit 1
            ;;
    esac
}

main "$@"
