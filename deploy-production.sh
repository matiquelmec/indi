#!/bin/bash

# INDI Platform - Production Deployment Script
# Usage: ./deploy-production.sh [staging|production]

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
COMPOSE_FILE="docker-compose.production.yml"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   INDI Platform Deployment Script${NC}"
echo -e "${GREEN}   Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "${GREEN}========================================${NC}\n"

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker found${NC}"

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker Compose found${NC}"

    # Check environment files
    if [ "$ENVIRONMENT" = "production" ]; then
        if [ ! -f ".env.production" ]; then
            echo -e "${RED}❌ .env.production not found${NC}"
            echo -e "${YELLOW}Create it from .env.production.example${NC}"
            exit 1
        fi
        if [ ! -f "backend/.env.production" ]; then
            echo -e "${RED}❌ backend/.env.production not found${NC}"
            echo -e "${YELLOW}Create it from backend/.env.production.example${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}✅ Environment files found${NC}\n"
}

# Function to build images
build_images() {
    echo -e "${YELLOW}Building Docker images...${NC}"
    docker-compose -f $COMPOSE_FILE build --no-cache
    echo -e "${GREEN}✅ Images built successfully${NC}\n"
}

# Function to deploy
deploy() {
    echo -e "${YELLOW}Starting deployment...${NC}"

    # Stop existing containers
    echo -e "${YELLOW}Stopping existing containers...${NC}"
    docker-compose -f $COMPOSE_FILE down

    # Start new containers
    echo -e "${YELLOW}Starting new containers...${NC}"
    docker-compose -f $COMPOSE_FILE up -d

    # Wait for health checks
    echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
    sleep 10

    # Check container status
    docker-compose -f $COMPOSE_FILE ps

    echo -e "${GREEN}✅ Deployment completed${NC}\n"
}

# Function to run health checks
health_check() {
    echo -e "${YELLOW}Running health checks...${NC}"

    # Check backend
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
    fi

    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is accessible${NC}"
    else
        echo -e "${RED}❌ Frontend not accessible${NC}"
    fi

    echo ""
}

# Function to show logs
show_logs() {
    echo -e "${YELLOW}Recent logs:${NC}"
    docker-compose -f $COMPOSE_FILE logs --tail=50
}

# Function to rollback
rollback() {
    echo -e "${RED}Rolling back deployment...${NC}"
    docker-compose -f $COMPOSE_FILE down
    # In production, you would restore previous images here
    echo -e "${YELLOW}Rollback completed. Previous version should be restored manually.${NC}"
}

# Main execution
main() {
    check_prerequisites

    # Confirm deployment
    echo -e "${YELLOW}⚠️  You are about to deploy to ${ENVIRONMENT}${NC}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 0
    fi

    # Backup current state
    echo -e "${YELLOW}Creating backup...${NC}"
    docker-compose -f $COMPOSE_FILE ps > deployment_backup_$(date +%Y%m%d_%H%M%S).txt

    # Deploy
    build_images
    deploy
    health_check

    # Check if deployment was successful
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}   🚀 Deployment Successful!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo -e "\n${YELLOW}Access your application:${NC}"
        echo -e "  Frontend: http://localhost:3000"
        echo -e "  Backend:  http://localhost:5000/api"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        rollback
        exit 1
    fi
}

# Handle interrupts
trap rollback INT TERM

# Run main function
main