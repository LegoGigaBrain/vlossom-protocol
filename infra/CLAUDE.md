# Infrastructure

**Version**: V6.4.0 | December 2025

> Purpose: Docker configurations, deployment scripts, and infrastructure-as-code for Vlossom services.

## Canonical References
- [Doc 23: DevOps and Infrastructure](../../docs/vlossom/23-devops-and-infrastructure.md)

## Key Files
- `docker/Dockerfile.api` — API service container
- `docker/docker-compose.yml` — Local development stack

## Local Development Stack
- PostgreSQL 16 (port 5432)
- Redis 7 (port 6379)
- Hardhat node (port 8545, optional)

## Local Conventions
- Use `docker-compose up` for local services
- All secrets via environment variables
- Never commit `.env` files

## Production Architecture (planned)
| Layer | Provider |
|-------|----------|
| Frontend | Vercel |
| Backend | AWS ECS/Fargate |
| Database | AWS RDS (PostgreSQL) |
| Cache | AWS ElastiCache (Redis) |
| Logging | CloudWatch |

## Commands
```bash
# Start local services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Gotchas
- Paymaster is a critical production dependency
- All user-facing incidents require calm, clear messaging
- Database backups daily, Redis hourly
