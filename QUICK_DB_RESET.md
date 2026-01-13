# Quick Database Reset Reference

## One-Command Reset

### Complete Reset (Clean + Migrate + Seed)
```bash
# Windows PowerShell
.\reset-database.ps1

# Linux/Mac
./reset-database.sh

# NPM
npm run db:reset

# Direct Node
node reset-database.cjs all
```

## Individual Operations

### Clean Database (Drop All Tables)
```bash
npm run db:clean
# or
node reset-database.cjs clean
```

### Run Migrations Only
```bash
npm run db:reset:migrate
# or
node reset-database.cjs migrate
```

### Seed Data Only
```bash
npm run db:reset:seed
# or
node reset-database.cjs seed
```

## What You Get After Reset

✅ **Clean Database** - All tables, sequences, and views dropped  
✅ **Fresh Schema** - All migrations applied in correct order  
✅ **Test Data** - Ready-to-use sample data:
- Test user: `test@example.com`
- Sample project with content
- Analytics data
- Scheduled content

## Common Use Cases

### Fresh Start for Development
```bash
npm run db:reset && npm run dev
```

### Reset Before Testing
```bash
npm run db:reset && npm test
```

### Clean Slate for Demo
```bash
npm run db:reset
```

## Safety Reminder

⚠️ **This deletes ALL data!** Only use in development.

## Need Help?

See full documentation: `DATABASE_RESET_GUIDE.md`
