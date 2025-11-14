# Client Invitation Flow

## Overview

The system now uses **Supabase's secure invitation flow** instead of creating users with pre-set passwords. This is more secure and provides a better user experience.

## How It Works

### 1. Admin Invites Client

When a staff member (admin, founder, or ops) invites a new client:

**Frontend (Client Management):**
- Navigate to Staff Dashboard → Clients
- Click "Invite Client" button
- Fill out form:
  - **Email** (required) - Client's email address
  - **Full Name** (required) - Client's full name
  - **Phone** (optional) - Client's phone number
- Click "Send Invitation"

**What Happens:**
1. API endpoint `/api/clients/create` is called
2. Backend uses `supabase.auth.admin.inviteUserByEmail()`
3. Supabase sends a secure invitation email to the client

### 2. Client Receives Email

The client receives an email from Supabase with:
- **Subject**: "You have been invited to join Freedom Aviation"
- **Content**: Secure magic link that expires in 24 hours
- **Call to Action**: "Accept Invitation" button

### 3. Client Sets Password

When the client clicks the invitation link:
1. They are taken to a Supabase-hosted page
2. They are prompted to **create their own password**
3. Password requirements:
   - Minimum 6 characters
   - Client chooses their own secure password
4. After setting password, they are redirected to: `https://www.freedomaviationco.com/dashboard`

### 4. Client Accesses Dashboard

After setting their password:
- Client is automatically logged in
- Redirected to their owner dashboard at `/dashboard`
- Can immediately start using the platform

## Security Benefits

### ✅ **Better than Password Creation:**
- **No password sharing** - Admin never knows the client's password
- **Secure magic links** - Links expire after 24 hours
- **Client controls password** - Users choose their own memorable password
- **Email verification** - Confirms client owns the email address

### ✅ **Compared to Old Flow:**
| Old Flow (Admin Creates Password) | New Flow (Invitation) |
|-----------------------------------|----------------------|
| ❌ Admin sets password | ✅ Client sets own password |
| ❌ Password shared insecurely | ✅ No password sharing |
| ❌ Client may not change password | ✅ Client creates secure password |
| ❌ No email verification | ✅ Email verified via magic link |

## API Endpoint Details

### POST `/api/clients/create`

**Request Body:**
```json
{
  "email": "client@example.com",
  "full_name": "John Doe",
  "phone": "+1 (555) 123-4567",  // optional
  "sendInvite": true              // optional, defaults to true
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Invitation sent! The user will receive an email to set their password and access the dashboard.",
  "user": {
    "id": "uuid-here",
    "email": "client@example.com",
    "full_name": "John Doe",
    "phone": "+1 (555) 123-4567"
  },
  "inviteSent": true
}
```

**Response (Error):**
```json
{
  "error": "Failed to invite user",
  "message": "User already registered"
}
```

## Environment Configuration

### Required in Vercel/Production:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Site URL (for email redirects)
SITE_URL=https://www.freedomaviationco.com
# OR
FRONTEND_URL=https://www.freedomaviationco.com
```

### Email Template Customization (Optional):

You can customize the invitation email in Supabase:
1. Go to **Authentication → Email Templates** in Supabase Dashboard
2. Edit the **"Invite user"** template
3. Customize:
   - Subject line
   - Email body content
   - Button text
   - Branding/logo

## Troubleshooting

### Client Didn't Receive Email

**Possible Causes:**
1. **Email in spam folder** - Check spam/junk folders
2. **Invalid email address** - Verify email is correct
3. **Email already registered** - User may already have an account
4. **Supabase email limits** - Free tier has limits, check Supabase dashboard

**Solutions:**
- Resend invitation (just call the API again with same email)
- Check Supabase logs: Authentication → Logs
- Verify email provider isn't blocking Supabase emails

### Invitation Link Expired

- Invitation links expire after **24 hours**
- **Solution**: Resend the invitation
- Client will get a new link

### Client Can't Set Password

**Check:**
1. Is the link still valid? (< 24 hours old)
2. Has the user already set a password?
3. Check Supabase Auth logs for errors

### User Created But No Email Sent

If `sendInvite: false` is passed:
- User is created but no email is sent
- This is for special cases (like admin-created accounts)
- User must be given credentials separately

## Migration Guide

### From Old System (Password Creation)

If you have existing clients created with the old system:
1. They can continue to log in with their existing password
2. No action needed for existing users
3. Only **new** clients will use the invitation flow

### Testing

To test the invitation flow:
1. Go to Staff Dashboard → Clients
2. Click "Invite Client"
3. Enter a test email you have access to
4. Check your email
5. Click the invitation link
6. Set a password
7. Verify you're redirected to `/dashboard`

## Code Changes Summary

### Backend (`server/routes.ts`)

```typescript
// OLD: Create user with password
await supabase.auth.admin.createUser({
  email,
  password, // ❌ Admin sets password
  email_confirm: true
});

// NEW: Invite user (they set their own password)
await supabase.auth.admin.inviteUserByEmail(email, {
  emailRedirectTo: `${baseUrl}/dashboard`,
  data: { full_name, phone }
});
```

### Frontend (`client/src/components/clients-table.tsx`)

**Removed:**
- Password input field
- Password state variable
- Password validation

**Changed:**
- "Add Client" → "Invite Client"
- "Create Client" → "Send Invitation"
- Success message updated

## Future Enhancements

### Potential Improvements:
1. **Custom email template** - Branded Freedom Aviation emails
2. **Resend invitation** - Add "Resend" button for pending invites
3. **Invitation status** - Track pending/accepted invitations
4. **Bulk invitations** - Invite multiple clients at once
5. **Welcome email** - Send onboarding email after password setup

---

**Updated**: November 2024  
**Version**: 2.0 (Invitation Flow)

