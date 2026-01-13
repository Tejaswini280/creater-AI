#!/bin/bash

# Database Reset Script - Complete Clean, Migrate, and Seed
# This script will drop all tables, recreate schema, run migrations, and seed data

echo "========================================"
echo "Database Reset Script"
echo "========================================"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo "✓ Environment variables loaded"
else
    echo "✗ .env file not found"
    exit 1
fi

echo ""
echo "Step 1: Cleaning database..."
node reset-database.cjs clean

if [ $? -ne 0 ]; then
    echo "✗ Database cleaning failed"
    exit 1
fi

echo ""
echo "Step 2: Running migrations..."
node reset-database.cjs migrate

if [ $? -ne 0 ]; then
    echo "✗ Migration failed"
    exit 1
fi

echo ""
echo "Step 3: Seeding database..."
node reset-database.cjs seed

if [ $? -ne 0 ]; then
    echo "✗ Seeding failed"
    exit 1
fi

echo ""
echo "========================================"
echo "Database Reset Complete!"
echo "========================================"
echo ""
echo "Your database has been:"
echo "  ✓ Cleaned (all tables dropped)"
echo "  ✓ Migrated (schema recreated)"
echo "  ✓ Seeded (test data added)"
echo ""
