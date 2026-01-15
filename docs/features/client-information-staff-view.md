# Client Information - Staff Dashboard View

## Overview
Enhanced the Staff Dashboard's Client Management tab to provide comprehensive visibility into all client information, including invoices, aircraft, and payment history.

## What Information Staff Can Now See

### 1. **Client Table Overview**
When staff view the Clients tab, they see:
- **Name** - Full name of the client
- **Email** - Contact email
- **Phone** - Phone number (if provided)
- **Aircraft Count** - Number of aircraft owned
- **Join Date** - When they became a member
- **Status** - Active/Inactive
- **Actions** - View Details or Edit

### 2. **Detailed Client View (New)**
Clicking the **View** (eye icon) button opens a comprehensive dialog with 4 tabs:

#### **Overview Tab**
- **Contact Information**
  - Full Name
  - Email Address
  - Phone Number
  - Role (owner, admin, etc.)
  - Member Since date
  
- **Quick Stats Dashboard**
  - Total Aircraft Owned
  - Total Invoices
  - Total Service Requests

#### **Aircraft Tab**
Shows all aircraft owned by the client:
- Tail Number (prominently displayed)
- Make & Model
- Year of manufacture
- Current Hobbs Hours
- Aircraft Status
- Registration details

#### **Invoices Tab**
Complete invoice and payment history:
- **Invoice List**
  - Invoice Number
  - Aircraft associated
  - Status (Draft, Finalized, Paid)
  - Total Amount
  - Line items breakdown (hours × rate)
  - Created date
  - Payment date (if paid)
  
- **Payment Summary**
  - Total Amount Invoiced (lifetime)
  - Total Amount Paid (lifetime)
  - Outstanding balance visualization

#### **Activity Tab**
Recent service requests and interactions:
- Service Request Type
- Associated Aircraft
- Status (Pending, In Progress, Completed)
- Description/Notes
- Date Created
- Timeline of interactions

## Key Features

### What We Know About Clients Who Pay Invoices
Based on the invoice payment flow:

1. **Authentication Required**: Clients MUST be logged in to pay invoices
   - They cannot pay as guests
   - They have full dashboard accounts

2. **Account Information Available**:
   - User ID (owner_id)
   - Email Address
   - Full Name
   - Phone Number (if provided)
   - Role = 'owner' (default)
   - Account creation date

3. **Payment Integration**:
   - Stripe Customer Profile
   - Payment Method on file
   - Transaction History
   - Invoice-to-Payment mapping via:
     - `stripe_checkout_session_id`
     - `stripe_payment_intent_id`

4. **Associated Data**:
   - Aircraft Ownership (via aircraft_id)
   - Service History
   - Maintenance Records
   - Flight Logs (if applicable)

## Database Schema Reference

### Key Tables Used
```sql
-- Client profile data
user_profiles:
  - id (UUID)
  - email
  - full_name
  - phone
  - role
  - created_at

-- Invoice data
invoices:
  - owner_id → user_profiles(id)
  - aircraft_id → aircraft(id)
  - amount
  - status
  - stripe_checkout_session_id
  - stripe_payment_intent_id
  - paid_date

-- Aircraft ownership
aircraft:
  - owner_id → user_profiles(id)
  - tail_number
  - model
  - year
  - hobbs_hours

-- Service requests
service_requests:
  - user_id → user_profiles(id)
  - aircraft_id
  - service_type
  - status
  - description
```

## User Experience Flow

### For Staff:
1. Navigate to **Staff Dashboard** → **Clients Tab**
2. See list of all clients with basic info
3. Click **Eye Icon** to view full details
4. Navigate through tabs to see:
   - Contact info
   - Aircraft owned
   - Complete invoice/payment history
   - Service request activity
5. Click **Edit** to update client contact information

### Data Refresh:
- Client list automatically updates on changes
- Detailed view queries fresh data on each open
- Invoice statuses update in real-time via webhooks

## Security & Permissions

### Row Level Security (RLS)
Staff can view clients because:
```sql
-- From supabase-schema.sql
CREATE POLICY "Owners can view own invoices" ON public.invoices
  FOR SELECT USING (
    owner_id = auth.uid() OR
    created_by_cfi_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'staff', 'founder'))
  );
```

### API Endpoints Used
- `GET /api/clients` - List all clients (service role)
- Direct Supabase queries for detailed data:
  - `user_profiles` table
  - `aircraft` table
  - `invoices` + `invoice_lines` tables
  - `service_requests` table

## Benefits

### For Staff:
1. **Complete Client Visibility** - See everything about a client in one place
2. **Payment Tracking** - Know exactly what clients have paid
3. **Quick Reference** - Fast access to client aircraft and contact info
4. **Activity Monitoring** - Track service requests and interactions
5. **Better Support** - Answer client questions with full context

### For Business:
1. **Revenue Tracking** - See total invoiced vs. paid per client
2. **Client Insights** - Understand aircraft ownership and usage
3. **Payment History** - Complete audit trail of all transactions
4. **Service Quality** - Monitor request/response patterns
5. **Account Management** - Identify clients needing attention

## Technical Implementation

### Components Modified:
- `client/src/components/clients-table.tsx` - Enhanced with detailed view

### New Features Added:
- Multi-tab detail dialog
- Real-time data fetching
- Invoice summary calculations
- Payment history visualization
- Service request timeline

### Dependencies:
- `@tanstack/react-query` - Data fetching
- `date-fns` - Date formatting
- `lucide-react` - Icons
- Supabase client - Database queries

## Future Enhancements

Potential additions:
1. Export client data to PDF/CSV
2. Send messages to clients directly
3. Create invoices from client view
4. Schedule service appointments
5. View client documents/attachments
6. Track client lifetime value (LTV)
7. Client segmentation and filtering
8. Payment plan management

## Support & Maintenance

### Monitoring:
- Check console for query errors
- Monitor RLS policy performance
- Track page load times for detail view

### Common Issues:
1. **Client not showing**: Check role = 'owner'
2. **Invoices not appearing**: Verify owner_id matches
3. **Permission errors**: Confirm staff role in user_profiles

### Related Documentation:
- [Invoice Payment Flow](../setup/stripe-configuration.md)
- [Database Schema](../architecture/database-schema.md)
- [Staff Dashboard](../development/staff-dashboard-features.md)




























