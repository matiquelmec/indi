# 🚀 INDI Platform - Deployment Guide

## Production Deployment Checklist

### Required Environment Variables (GitHub Secrets)

#### Docker Registry
- `DOCKER_USERNAME`: Docker Hub username
- `DOCKER_PASSWORD`: Docker Hub password/token
- `DOCKER_REGISTRY`: Docker registry URL (e.g., `your-username`)

#### Production Server
- `PRODUCTION_HOST`: Production server IP/domain
- `PRODUCTION_USER`: SSH username for production server
- `PRODUCTION_SSH_KEY`: Private SSH key for production access

#### Staging Server (Optional)
- `STAGING_HOST`: Staging server IP/domain
- `STAGING_USER`: SSH username for staging server
- `STAGING_SSH_KEY`: Private SSH key for staging access

#### Notifications
- `SLACK_WEBHOOK_URL`: Slack webhook for deployment notifications

### Server Setup

#### 1. Production Server Requirements
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create deployment directory
sudo mkdir -p /var/www/indi-platform
sudo chown $USER:$USER /var/www/indi-platform
cd /var/www/indi-platform

# Clone repository
git clone https://github.com/your-username/indi-platform.git .
```

#### 2. Environment Configuration
```bash
# Create production environment file
cp backend/.env.production backend/.env
# Edit backend/.env with real production values:
# - Database credentials
# - JWT secrets (already generated)
# - API keys (Stripe, SendGrid, etc.)
# - Domain configuration
```

#### 3. SSL Certificate Setup
```bash
# Using Certbot for SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### Deployment Commands

#### Manual Deployment
```bash
# Build and deploy
docker-compose -f docker-compose.yml up -d --build

# View logs
docker-compose logs -f

# Health check
curl https://yourdomain.com/api/health
```

#### Rollback
```bash
# Rollback to previous version
docker-compose down
docker-compose up -d

# Or specific image tag
docker-compose pull indi-platform:previous-tag
docker-compose up -d
```

### Monitoring

#### Health Checks
- Frontend: `https://yourdomain.com`
- Backend API: `https://yourdomain.com/api/health`
- Database: Check via backend health endpoint

#### Log Monitoring
```bash
# Application logs
docker-compose logs -f app

# Database logs
docker-compose logs -f db

# Nginx logs
docker-compose logs -f nginx
```

### Security Considerations

#### 1. Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
```

#### 2. Database Security
- Use strong passwords
- Enable SSL connections
- Regular backups
- Network isolation

#### 3. Application Security
- JWT secrets rotation
- API rate limiting
- HTTPS only
- Security headers

### Backup Strategy

#### 1. Database Backups
```bash
# Daily automated backup
docker exec postgres pg_dump -U postgres indi_prod > backup_$(date +%Y%m%d).sql

# Upload to S3 or similar
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
```

#### 2. Application Backups
```bash
# Backup application files
tar -czf app_backup_$(date +%Y%m%d).tar.gz /var/www/indi-platform
```

### Performance Optimization

#### 1. CDN Setup
- Use CloudFlare or AWS CloudFront
- Cache static assets
- Optimize images

#### 2. Database Optimization
- Connection pooling
- Query optimization
- Indexes on frequently queried fields

#### 3. Server Optimization
- Enable gzip compression
- HTTP/2 support
- Proper caching headers

### Troubleshooting

#### Common Issues
1. **502 Bad Gateway**: Backend container not running
2. **Database Connection Error**: Check credentials and network
3. **SSL Certificate Issues**: Renew with certbot
4. **High Memory Usage**: Check for memory leaks

#### Debug Commands
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs [service-name]

# Execute commands in container
docker-compose exec app bash

# Check system resources
docker stats
```

## CI/CD Pipeline

### Workflow Triggers
- **CI**: On push to `main` or `develop`, on pull requests
- **CD**: On push to `main` (production), `develop` (staging)

### Pipeline Stages
1. **Testing**: Unit tests, integration tests, security audit
2. **Building**: Docker image creation
3. **Deployment**: Automated deployment to servers
4. **Notification**: Slack alerts for deployment status

### Manual Triggers
- Create GitHub release for production deployment
- Use workflow dispatch for manual deployments

---

**✅ Production Checklist Complete**
- [ ] Server provisioned and configured
- [ ] Domain and SSL configured
- [ ] Environment variables set
- [ ] GitHub secrets configured
- [ ] Database setup and migrated
- [ ] Monitoring and alerts configured
- [ ] Backup strategy implemented