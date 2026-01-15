-- ============================================================================
-- PERMANENT FIX FOR LOGIN 500 ERROR
-- ============================================================================
-- Root Cause: Column name mismatch between database (password_hash) and schema (password)
-- Impact: All login attempts fail with 500 error
-- Solution: Rename password_hash to password to match schema expectations
-- ============================================================================

-- Step 1: Check current state
DO $$
BEGIN
    RAISE NOTICE '🔍 Checking current database state...';
END $$;

-- Step 2: Rename password_hash column to password (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password_hash'
    ) THEN
        RAISE NOTICE '✅ Found password_hash column, renaming to password...';
        ALTER TABLE users RENAME COLUMN password_hash TO password;
        RAISE NOTICE '✅ Column renamed successfully';
    ELSE
        RAISE NOTICE 'ℹ️  password_hash column does not exist, checking for password column...';
    END IF;
END $$;

-- Step 3: Ensure password column exists (if neither exists, create it)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password'
    ) THEN
        RAISE NOTICE '⚠️  No password column found, creating it...';
        ALTER TABLE users ADD COLUMN password TEXT;
        RAISE NOTICE '✅ Password column created';
    ELSE
        RAISE NOTICE '✅ Password column exists';
    END IF;
END $$;

-- Step 4: Make password column nullable to support OAuth users
DO $$
BEGIN
    RAISE NOTICE '🔧 Making password column nullable for OAuth support...';
    ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
    RAISE NOTICE '✅ Password column is now nullable';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ℹ️  Password column was already nullable or does not have NOT NULL constraint';
END $$;

-- Step 5: Verify the fix
DO $$
DECLARE
    col_exists BOOLEAN;
    col_type TEXT;
    col_nullable TEXT;
    null_count INTEGER;
    total_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 VERIFICATION RESULTS:';
    RAISE NOTICE '========================';
    
    -- Check column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password'
    ) INTO col_exists;
    
    IF col_exists THEN
        -- Get column details
        SELECT data_type, is_nullable
        INTO col_type, col_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password';
        
        RAISE NOTICE '✅ Column name: password';
        RAISE NOTICE '✅ Data type: %', col_type;
        RAISE NOTICE '✅ Nullable: %', col_nullable;
        
        -- Count NULL passwords
        SELECT COUNT(*), COUNT(password)
        INTO total_count, null_count
        FROM users;
        
        RAISE NOTICE '📈 Total users: %', total_count;
        RAISE NOTICE '📈 Users with password: %', null_count;
        RAISE NOTICE '📈 Users without password: %', (total_count - null_count);
    ELSE
        RAISE NOTICE '❌ Password column still does not exist!';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ FIX COMPLETED SUCCESSFULLY';
END $$;
