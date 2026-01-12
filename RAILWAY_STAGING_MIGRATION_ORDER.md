# Railway Staging Migration Order
# Execute in this exact order to avoid dependency issues

1. 0001_core_tables_clean.sql
2. 0002_add_missing_columns.sql  
3. 0003_essential_tables.sql
4. 0004_seed_essential_data.sql

# Skip all other migrations that have dependency issues
# These 4 migrations provide a clean, working database schema
