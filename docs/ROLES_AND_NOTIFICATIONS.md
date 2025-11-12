# User Roles and Email Notifications System

## Overview

Freedom Aviation now supports a comprehensive role-based access control system with customizable email notifications for different user types.

## User Roles

### 1. **Owner** (Default)
- Aircraft owners who can view and manage their aircraft
- Can submit service requests
- Can request flight instruction

### 2. **Ops** (Operations Staff)
- Can view all aircraft and service requests
- Receives email notifications for new service requests
- Can update service request status and assignments
- Access to staff dashboard

### 3. **CFI** (Certified Flight Instructor)
- Can view flight instruction requests
- Receives email notifications for new instruction requests
- Can manage instruction schedules
- Access to staff dashboard

### 4. **Staff** (General Staff)
- Basic staff access to view requests
- Access to staff dashboard

### 5. **Admin** (Administrator)
- Full system access
- Can manage all aspects of the platform
- User management capabilities

### 6. **Founder** (Super Admin)
- Has all permissions of Admin, Ops, and CFI combined
- Can customize which notifications they receive
- Full access to all system features
- Special notification preferences panel

## Email Notification System

### Setup

1. **Environment Variables**
   Add these to your `.env.local` or Vercel environment:
   ```env
   # Email service configuration
   EMAIL_SERVICE=resend
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM="Freedom Aviation <notifications@freedomaviationco.com>"
   
   # API protection for email processing endpoint
   EMAIL_NOTIFICATIONS_API_KEY=your-secure-api-key
   
   # Optional: Supabase webhook secret for immediate processing
   SUPABASE_WEBHOOK_SECRET=your-webhook-secret
   ```

2. **Database Setup**
   Run the migration scripts in order:
   ```bash
   # Add new roles
   psql $DATABASE_URL < scripts/add-ops-role.sql
   
   # Add email notification system
   psql $DATABASE_URL < scripts/add-email-triggers.sql
   ```

3. **Resend Configuration**
   - Sign up at [resend.com](https://resend.com)
   - Verify your domain or use the test domain `onboarding@resend.dev`
   - Get your API key from the dashboard

### How It Works

1. **Automatic Notifications**
   - When a service request is created → Ops users receive email
   - When an instruction request is created → CFI users receive email
   - Founders receive notifications based on their preferences

2. **Email Processing**
   - Notifications are queued in the `email_notifications` table
   - Process via API endpoint: `POST /api/email-notifications/process`
   - Or automatically via Supabase webhook

3. **Notification Preferences**
   - Founders can customize notifications in their dashboard
   - Toggle individual notification types on/off
   - Master switch to disable all emails

### Processing Emails

#### Option 1: Manual Processing (Testing)
```bash
curl -X POST https://your-app.com/api/email-notifications/process \
  -H "X-API-Key: your-email-notifications-api-key"
```

#### Option 2: Scheduled Processing (Production)
Set up a cron job (e.g., Vercel Cron) to run every 5 minutes:
```javascript
// vercel.json
{
  "crons": [{
    "path": "/api/email-notifications/process",
    "schedule": "*/5 * * * *"
  }]
}
```

#### Option 3: Immediate Processing (Recommended)
Configure a Supabase webhook:
1. Go to Supabase Dashboard → Database → Webhooks
2. Create webhook for `email_notifications` table INSERT events
3. Set URL to `https://your-app.com/api/webhooks/email-notification`
4. Add header: `X-Webhook-Secret: your-webhook-secret`

## Managing Users

### Assigning Roles

```sql
-- Make a user an Ops staff member
UPDATE public.user_profiles 
SET role = 'ops' 
WHERE email = 'ops@example.com';

-- Make a user a CFI
UPDATE public.user_profiles 
SET role = 'cfi' 
WHERE email = 'instructor@example.com';

-- Make a user a Founder
UPDATE public.user_profiles 
SET role = 'founder' 
WHERE email = 'founder@example.com';
```

### Viewing Current Roles

```sql
-- See all staff users
SELECT email, full_name, role 
FROM public.user_profiles 
WHERE role IN ('ops', 'cfi', 'staff', 'admin', 'founder')
ORDER BY role, full_name;
```

## Email Templates

The system includes professional HTML email templates for:

1. **Service Request Notifications**
   - Shows priority level (High/Medium/Low)
   - Aircraft and owner details
   - Request description
   - Direct link to staff dashboard

2. **Flight Instruction Request Notifications**
   - Student information
   - Requested date and time
   - Aircraft details
   - Direct link to schedule/approve

## Troubleshooting

### Emails Not Sending

1. Check environment variables are set correctly
2. Verify Resend API key is valid
3. Check `email_notifications` table for failed messages:
   ```sql
   SELECT * FROM email_notifications 
   WHERE status = 'failed' 
   ORDER BY created_at DESC;
   ```

### No Recipients Found

1. Ensure users have the correct role assigned
2. Verify email addresses are set in user_profiles
3. For founders, check notification preferences

### Testing Email Templates

Set `EMAIL_SERVICE=console` in development to log emails instead of sending:
```env
EMAIL_SERVICE=console
```

## Security Considerations

1. **API Key Protection**
   - The email processing endpoint requires `X-API-Key` header
   - Keep `EMAIL_NOTIFICATIONS_API_KEY` secure

2. **Webhook Verification**
   - Webhooks should verify `X-Webhook-Secret` header
   - Use HTTPS only for webhook endpoints

3. **Role-Based Access**
   - All database operations respect Row Level Security
   - Users can only see/modify what their role permits

## Future Enhancements

- SMS notifications via Twilio
- In-app notifications
- Notification scheduling preferences
- Email digest options
- Custom notification rules
