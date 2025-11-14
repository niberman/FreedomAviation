# Founder Superuser Update - Quick Guide

## 🎯 What Was Done

The `founder` role has been upgraded to have complete superuser access across the entire application:

- ✅ **Database**: All RLS policies updated to include `founder`
- ✅ **Backend**: All API routes recognize `founder` as superuser
- ✅ **Frontend**: Role checking functions include `founder`
- ✅ **Types**: All TypeScript definitions updated

## 🚀 How to Apply (Production Database)

### Step 1: Run the Migration Script

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file: `/migrations/add_founder_to_all_policies.sql`
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **Run**

### Step 2: Verify the Changes

Run this verification query:

```sql
-- Check that founder is included in policies
SELECT 
  tablename,
  policyname,
  CASE 
    WHEN qual LIKE '%founder%' THEN '✅ Includes founder'
    WHEN qual LIKE '%admin%' AND qual NOT LIKE '%founder%' THEN '⚠️ Missing founder'
    ELSE '➖ N/A'
  END as founder_status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'aircraft', 'service_requests', 'invoices')
  AND cmd IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL')
ORDER BY tablename, policyname;
```

### Step 3: Assign Founder Role

Update a user to be a founder:

```sql
-- Replace with your email
UPDATE public.user_profiles 
SET role = 'founder'
WHERE email = 'your-email@example.com';
```

### Step 4: Test Access

Log in as the founder user and verify you can:
- ✅ View all users in Staff Portal
- ✅ Edit any user's profile
- ✅ Create/edit/delete any aircraft
- ✅ View and manage all service requests
- ✅ Create invoices for any CFI
- ✅ Access all admin features

## 📋 What Changed

### Database Tables with Updated Policies

| Table | What Founder Can Do |
|-------|-------------------|
| `user_profiles` | View all, update all |
| `aircraft` | Full CRUD access |
| `memberships` | View all |
| `maintenance` | Full CRUD access |
| `consumable_events` | Full CRUD access |
| `service_requests` | Full CRUD access |
| `service_tasks` | Full CRUD access |
| `invoices` | Full CRUD access |
| `invoice_lines` | Full CRUD access |

### RPC Functions Updated

- `create_instruction_invoice()` - Founder can create for any CFI
- `finalize_invoice()` - Founder can finalize any invoice

## 🔍 Current Role Hierarchy

```
founder       → SUPERUSER (all permissions)
admin         → Full admin access (most tables)
cfi           → Flight instruction management
ops           → Operations & service requests
staff         → General staff access
owner         → Aircraft owner (default)
```

## ⚠️ Important Notes

1. **Security**: Only assign `founder` to fully trusted individuals
2. **Existing Admins**: Current admins retain their permissions
3. **Backward Compatible**: All existing role checks still work
4. **No Breaking Changes**: Owners and other roles unaffected

## 🆘 Rollback (If Needed)

If you need to revert the changes:

```sql
-- This won't break anything, but founder won't have elevated access
UPDATE public.user_profiles 
SET role = 'admin'
WHERE role = 'founder';
```

Then re-run the original policies without `founder` from git history.

## 📞 Support

See `FOUNDER_SUPERUSER_UPDATE.md` for complete technical details.

## ✅ Migration Checklist

- [ ] Backup your database (Supabase does this automatically)
- [ ] Run migration script in Supabase SQL Editor
- [ ] Verify policies updated correctly
- [ ] Assign founder role to appropriate user(s)
- [ ] Test founder access in production
- [ ] Update any documentation referencing admin as highest role
- [ ] Monitor logs for any permission errors

---

**Created**: 2025-01-XX  
**Status**: Ready to apply  
**Risk Level**: Low (additive changes only)



