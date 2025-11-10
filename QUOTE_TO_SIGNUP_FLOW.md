# Quote to Signup Flow Implementation

## Overview
Implemented a streamlined flow where users who request a quote are automatically guided to create an account. This ensures every quote request is captured with a user account, improving lead tracking and conversion.

## Changes Made

### 1. **SimplePricingCalculator Component** (`client/src/components/simple-pricing-calculator.tsx`)

**Before:**
- Non-authenticated users saw a generic toast message
- No clear path to account creation
- Quote data was lost

**After:**
- Non-authenticated users are redirected to signup
- Quote data is preserved in sessionStorage
- Clear messaging: "Create Account to Continue"
- URL parameters track the quote source (`?action=register&from=quote`)

**Flow:**
```
User generates quote → Not logged in → Quote saved to sessionStorage → Redirect to /login?action=register&from=quote
```

### 2. **Login Page** (`client/src/pages/login.tsx`)

**Enhancements:**
- Reads URL parameters to auto-switch to registration mode
- Detects quote context with `from=quote` parameter
- Shows contextual messaging: "Create your account to save your quote"
- After successful signup:
  - Retrieves quote from sessionStorage
  - Saves quote to support_tickets table
  - Clears sessionStorage
  - Redirects to onboarding flow

**Success Message:**
- With quote: "Your quote has been saved. Let's complete your profile..."
- Without quote: "Redirecting to complete your profile..."

## User Flow

### For Non-Authenticated Users:
1. User configures aircraft and hours in calculator
2. Clicks "Get This Quote"
3. Toast notification: "Create Account to Continue"
4. Automatically redirected to signup page
5. Page shows: "Create your account to save your quote"
6. User creates account
7. Quote is automatically saved to their account
8. User redirected to onboarding to complete profile

### For Authenticated Users:
1. User configures aircraft and hours in calculator
2. Clicks "Get This Quote"
3. Quote saved immediately to support_tickets
4. Toast notification: "Quote Saved! We'll contact you within 24 hours."
5. Dialog closes (if in dialog mode)

## Technical Details

### sessionStorage Schema:
```json
{
  "aircraft_class": "High Performance",
  "aircraft_class_id": "performance",
  "monthly_hours": 20,
  "monthly_price": 2145,
  "timestamp": "2025-11-10T12:34:56.789Z"
}
```

### Quote Storage:
Quotes are saved to the `support_tickets` table with:
- `owner_id`: User's ID
- `subject`: "Pricing Quote Request"
- `body`: JSON with quote details including source tracking
- `status`: "open"

## Benefits

1. **Lead Capture**: Every quote request now creates a user account
2. **Data Preservation**: Quote preferences are saved even if user doesn't complete immediately
3. **Better UX**: Clear path from quote to account creation
4. **Tracking**: Can identify users who came through quote flow (`source: "signup_flow"`)
5. **Follow-up**: All quotes saved to support_tickets for team follow-up

## Testing Checklist

- [ ] Non-authenticated user generates quote → redirected to signup
- [ ] Quote data persists through signup flow
- [ ] Quote saved after successful registration
- [ ] User redirected to onboarding after signup
- [ ] Authenticated user generates quote → saved immediately
- [ ] sessionStorage cleared after quote is saved
- [ ] Error handling if quote save fails (doesn't block signup)
- [ ] Works from home page dialog
- [ ] Works from pricing configurator page
- [ ] Contextual messaging displays correctly

## Integration Points

### Components Using SimplePricingCalculator:
1. **Home Page** - SimpleCalculatorDialog
2. **Pricing Page** - Redirects to configurator
3. **Pricing Configurator Page** - Direct use

All three paths now lead to account creation for non-authenticated users.

## Future Enhancements

1. Pre-fill onboarding aircraft info from quote data
2. Track quote source in analytics
3. Email notification when quote is saved
4. Quote expiration handling
5. Quote history in user dashboard

