-- Comprehensive migration to ensure preview branch has all necessary tables
-- This creates any missing tables that exist in production but not in preview
-- Safe to run multiple times (idempotent)

-- Note: This is a minimal set. For full schema sync, export from production and import to preview.

-- Create user_profiles table if it doesn't exist (needed for RLS policies)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'owner',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for user_profiles if they don't exist
DO $$
BEGIN
    -- Users can view their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile"
        ON public.user_profiles
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
    END IF;

    -- Users can update their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile"
        ON public.user_profiles
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    END IF;

    -- Staff can view all profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Staff can view all profiles'
    ) THEN
        CREATE POLICY "Staff can view all profiles"
        ON public.user_profiles
        FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles up
                WHERE up.id = auth.uid()
                AND up.role IN ('staff', 'admin', 'founder')
            )
        );
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- Add comment
COMMENT ON TABLE public.user_profiles IS 'User profile data extending auth.users';

