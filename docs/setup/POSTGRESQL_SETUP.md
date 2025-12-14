# PostgreSQL Setup Guide

## Installation (Windows)

1. **Download PostgreSQL 14** from: https://www.postgresql.org/download/windows/
   - Select PostgreSQL 14.x for Windows x86-64
   - Or direct link: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **Run installer** with these settings:
   - Installation Directory: `C:\Program Files\PostgreSQL\14` (default)
   - Components: PostgreSQL Server, pgAdmin 4, Command Line Tools
   - Port: **5432** (default)
   - Superuser password: Choose a secure password (remember this!)
   - Locale: Default

3. **Verify installation:**
   ```bash
   psql --version
   # Should output: psql (PostgreSQL) 14.x

   sc query postgresql-x64-14
   # Should show: STATE: 4  RUNNING
   ```

## Database Creation

### Option 1: Using pgAdmin GUI (Easier)

1. Open pgAdmin 4 (installed with PostgreSQL)
2. Connect to localhost server (password: the one you set during installation)
3. Right-click "Databases" → "Create" → "Database"
4. Database name: `vlossom`
5. Owner: `postgres`
6. Click "Save"

### Option 2: Using Command Line

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE vlossom;

# Verify
\l

# Exit
\q
```

## Environment Configuration

Update `services/api/.env` with your PostgreSQL credentials:

```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/vlossom?schema=public"
```

Replace `YOUR_PASSWORD` with the superuser password you set during installation.

**Example:**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vlossom?schema=public"
```

## Run Migrations

Once the database is created and `.env` is configured, run Prisma migrations:

```bash
cd services/api

# Generate Prisma Client
pnpm db:generate

# Push schema to database
pnpm db:push

# Open Prisma Studio to verify (opens in browser at localhost:5555)
pnpm db:studio
```

## Verify Database Setup

### Using Prisma Studio

```bash
pnpm db:studio
```

This opens a GUI at http://localhost:5555 where you can see all tables:
- users
- stylist_profiles
- stylist_services
- bookings
- booking_status_history
- wallets
- wallet_transactions
- payment_requests

### Using psql Command Line

```bash
# Connect to database
psql -U postgres -d vlossom

# List all tables
\dt

# Describe table structure
\d "users"

# Exit
\q
```

## Troubleshooting

### Connection refused

**Problem:** Cannot connect to PostgreSQL

**Solutions:**
1. Check if PostgreSQL service is running:
   ```bash
   sc query postgresql-x64-14
   ```

2. Verify port 5432 is listening:
   ```bash
   netstat -an | findstr 5432
   ```

3. Restart PostgreSQL service if needed:
   ```bash
   net stop postgresql-x64-14
   net start postgresql-x64-14
   ```

### Authentication failed

**Problem:** Password rejected when connecting

**Solutions:**
1. Verify password in `.env` matches PostgreSQL superuser password
2. Check `pg_hba.conf` for authentication settings:
   - Location: `C:\Program Files\PostgreSQL\14\data\pg_hba.conf`
   - Ensure localhost has `md5` or `trust` authentication

### Migration errors

**Problem:** Prisma migrations fail

**Solutions:**
1. Ensure database exists:
   ```bash
   psql -U postgres -l
   ```

2. Check Prisma schema syntax:
   ```bash
   pnpm prisma validate
   ```

3. Try pushing schema directly (development only):
   ```bash
   pnpm db:push
   ```

### Database already exists

**Problem:** Error when trying to create database

**Solution:** Database was already created successfully. Skip to "Run Migrations" section.

## Database Management Commands

```bash
# Generate Prisma Client (after schema changes)
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Create a new migration (production)
pnpm db:migrate

# Open Prisma Studio GUI
pnpm db:studio

# View database schema in terminal
psql -U postgres -d vlossom -c "\dt"

# Reset database (WARNING: deletes all data)
psql -U postgres -c "DROP DATABASE IF EXISTS vlossom;"
psql -U postgres -c "CREATE DATABASE vlossom;"
pnpm db:push
```

## Next Steps

After PostgreSQL is set up:

1. **Run tests** to verify everything works:
   ```bash
   cd services/api
   pnpm test
   ```

2. **Start the API server**:
   ```bash
   pnpm dev
   ```

3. **Deploy to testnet** (optional):
   - See `contracts/QUICKSTART.md` for Base Sepolia deployment

## Notes

- **Development vs Production**: Use `db:push` in development, `db:migrate` in production
- **Password Security**: For development, simple passwords are okay. Use strong passwords in production.
- **Backup**: Database schema is version-controlled via Prisma migrations in Git
- **Port Conflicts**: If port 5432 is in use, choose a different port during installation and update `.env`
- **pgAdmin**: The GUI tool is helpful for browsing database structure and running queries
