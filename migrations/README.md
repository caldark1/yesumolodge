Run this migration against your Postgres database to add the `extensions` table and `payments.extension_id` column.

Usage (example using `psql`):

```bash
export DATABASE_URL="postgresql://user:password@host:5432/dbname"
psql "$DATABASE_URL" -f migrations/20260913_add_extensions.sql
```

Or using `psql` flags:

```bash
psql -h <host> -p <port> -U <user> -d <dbname> -f migrations/20260913_add_extensions.sql
```

Important:
- Review the SQL before running on production.
- Back up your database before applying migrations.
- If your environment requires migrations to be applied with a tool (Flyway, sqitch, prisma, etc.), convert this SQL to the appropriate migration file for that tool.
