# Onboarding System - Testing Guide

## Quick Start

To test the complete onboarding flow:

1. **Start the development server**
   ```bash
   npm install
   npm run dev
   ```

2. **Access the application**
   - Open http://localhost:5173

3. **Test the flow**
   - Go to `/login`
   - Click "Don't have an account? Register"
   - Create a new account
   - You'll be automatically redirected to `/onboarding`

## Test Scenarios

### Scenario 1: Full Onboarding Flow (Happy Path)

**Steps:**
1. Navigate to `/login`
2. Click "Don't have an account? Register"
3. Fill in:
   - Full Name: "John Doe"
   - Email: "john.doe@example.com"
   - Password: "password123"
   - Confirm Password: "password123"
4. Click "Create Account"
5. Wait for redirect to `/onboarding`

**Step 1: Personal Info**
6. Verify name is pre-filled
7. Enter phone: "(555) 123-4567"
8. Select average monthly hours: "10-25 hours"
9. Click "Next"

**Step 2: Aircraft Info**
10. Enter:
    - Tail Number: "N12345"
    - Make: "Cirrus"
    - Model: "SR22T"
    - Year: "2024"
    - Hobbs Hours: "150.5"
    - Tach Hours: "145.2"
    - Base Location: "KAPA"
11. Click "Next"

**Step 3: Pricing**
12. Select "Class II — High-Performance / TAA"
13. Select "10-25 hours/month"
14. Verify calculated price shows correctly
15. Click "Complete Setup"

**Expected Results:**
- ✅ Success toast: "Welcome to Freedom Aviation!"
- ✅ Redirect to `/dashboard` after 1.5 seconds
- ✅ Dashboard shows aircraft N12345
- ✅ Membership badge shows "II"

**Backend Verification:**
```sql
-- Check user profile
SELECT * FROM user_profiles WHERE email = 'john.doe@example.com';

-- Check aircraft
SELECT * FROM aircraft WHERE tail_number = 'N12345';

-- Check membership
SELECT m.*, a.tail_number 
FROM memberships m 
JOIN aircraft a ON a.id = m.aircraft_id 
WHERE a.tail_number = 'N12345';
```

**Server Logs to Check:**
- "✓ User profile updated"
- "✓ Aircraft created"
- "✓ Membership created"
- "[CONSOLE MODE] WELCOME EMAIL would be sent to john.doe@example.com"
- "Stripe customer created: cus_xxxxx" (if Stripe configured)

---

### Scenario 2: Onboarding from Pricing Page

**Steps:**
1. Navigate to `/pricing`
2. Select a hangar location (optional)
3. Click "Get Started" on any pricing tier
4. Should redirect to `/onboarding?package=class-ii` (example)
5. Verify package is pre-selected in Step 3

**Expected Results:**
- ✅ User redirected to `/onboarding` with package parameter
- ✅ Package automatically selected when reaching Step 3

---

### Scenario 3: User Already Onboarded

**Steps:**
1. Complete onboarding as "John Doe"
2. Log out
3. Log back in as "John Doe"
4. Try to navigate to `/onboarding` manually

**Expected Results:**
- ✅ Toast: "Already set up"
- ✅ Automatic redirect to `/dashboard`
- ✅ User doesn't see onboarding form

---

### Scenario 4: Validation Errors

**Test Empty Fields (Step 1):**
1. Start onboarding
2. Leave "Full Name" empty
3. Click "Next"
4. Expected: Error toast "Please enter your full name"

**Test Empty Fields (Step 2):**
1. Complete Step 1
2. Leave "Tail Number" empty
3. Click "Next"
4. Expected: Error toast "Please enter your aircraft tail number"

**Test No Package Selected (Step 3):**
1. Complete Steps 1 & 2
2. Don't select a package
3. Click "Complete Setup"
4. Expected: Error toast "Please select a pricing package"

---

### Scenario 5: Backend Error Handling

**Test Database Connection Issue:**
1. Stop Supabase connection temporarily
2. Complete onboarding
3. Expected: Error toast with meaningful message
4. User stays on onboarding page

**Test Duplicate Tail Number:**
1. Complete onboarding with tail number "N12345"
2. Create another account
3. Try to onboard with same tail number "N12345"
4. Expected: Error message about duplicate tail number

---

## Email Testing

### Console Mode (Development)
1. Ensure `EMAIL_SERVICE=console` in `.env`
2. Complete onboarding
3. Check server terminal output
4. Should see:
   ```
   [CONSOLE MODE] WELCOME EMAIL would be sent to john.doe@example.com
   Welcome John Doe with aircraft N12345
   Package: class-ii, Hours: 10-25
   ```

### Resend Mode (Production)
1. Set `EMAIL_SERVICE=resend` in `.env`
2. Set `RESEND_API_KEY=re_xxxxx`
3. Set `EMAIL_FROM="Freedom Aviation <onboarding@resend.dev>"`
4. Complete onboarding
5. Check Resend dashboard for sent email
6. Check recipient inbox

**Expected Email Content:**
- Subject: "Welcome to Freedom Aviation!"
- Personalized greeting with user's name
- Account details (aircraft, package, hours)
- Next steps checklist
- CTA button linking to dashboard
- Support contact information

---

## Stripe Testing

### Development Mode (Customer Creation Only)
1. Ensure `STRIPE_SECRET_KEY` is set in `.env`
2. Complete onboarding
3. Check Stripe Dashboard → Customers
4. Should see new customer with:
   - Email matching user email
   - Name matching full name
   - Phone number
   - Metadata: user_id, aircraft_id

### Production Mode (With Subscriptions)
*Note: Requires price IDs to be configured*

1. Create products/prices in Stripe Dashboard
2. Update `server/routes.ts` with price ID mappings
3. Uncomment subscription creation code
4. Complete onboarding
5. Verify subscription created in Stripe Dashboard

---

## API Testing (Manual)

### Test Onboarding Endpoint Directly

```bash
# Get access token (after login)
ACCESS_TOKEN="your_token_here"

# Call onboarding API
curl -X POST http://localhost:5000/api/onboarding/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "personalInfo": {
      "fullName": "Jane Smith",
      "phone": "(555) 987-6543",
      "averageMonthlyHours": "25-40"
    },
    "aircraftInfo": {
      "tailNumber": "N67890",
      "make": "Cessna",
      "model": "182",
      "year": 2020,
      "hobbsHours": 500.5,
      "tachHours": 485.2,
      "baseLocation": "KBJC"
    },
    "pricing": {
      "packageId": "class-i",
      "hoursBand": "25-40"
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "data": {
    "userId": "uuid-here",
    "aircraftId": "uuid-here"
  }
}
```

---

## Browser Testing Checklist

### Desktop Browsers
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

### Mobile Browsers
- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Samsung Internet

### Responsive Design
- [ ] Mobile (375px - 767px)
- [ ] Tablet (768px - 1023px)
- [ ] Desktop (1024px+)

---

## Performance Testing

1. **Page Load Time**
   - Open DevTools → Network
   - Navigate to `/onboarding`
   - Should load in < 2 seconds

2. **Form Submission**
   - Complete all steps
   - Click "Complete Setup"
   - Should process in < 3 seconds

3. **Step Navigation**
   - Click "Next" between steps
   - Should be instant (< 100ms)

---

## Accessibility Testing

1. **Keyboard Navigation**
   - Tab through all form fields
   - Enter to submit form
   - Escape to close (if applicable)

2. **Screen Reader**
   - Test with VoiceOver (Mac) or NVDA (Windows)
   - All fields should have proper labels
   - Error messages should be announced

3. **Color Contrast**
   - Check text readability
   - Verify button states are distinguishable

---

## Common Issues & Solutions

### Issue: Onboarding page shows loading forever
**Solution:** Check browser console for auth errors. User might not be logged in.

### Issue: "Aircraft already exists" error
**Solution:** Tail numbers must be unique. Use a different tail number.

### Issue: Email not sent
**Solution:** Check EMAIL_SERVICE environment variable. Verify Resend API key if using Resend.

### Issue: Stripe customer not created
**Solution:** Verify STRIPE_SECRET_KEY is set. Check Stripe API logs for errors.

### Issue: Cannot navigate to Step 2
**Solution:** Check validation. Ensure all required fields in Step 1 are filled.

---

## Automated Testing (Future)

```typescript
// Example test structure
describe('Onboarding Flow', () => {
  it('should complete full onboarding', async () => {
    // 1. Register user
    // 2. Navigate to onboarding
    // 3. Fill Step 1
    // 4. Fill Step 2
    // 5. Select pricing
    // 6. Submit
    // 7. Verify redirect to dashboard
    // 8. Verify database records
  });
  
  it('should prevent duplicate onboarding', async () => {
    // 1. Complete onboarding
    // 2. Try to access /onboarding again
    // 3. Verify redirect to dashboard
  });
});
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Set `EMAIL_SERVICE=resend`
- [ ] Configure valid `RESEND_API_KEY`
- [ ] Verify Resend domain is verified
- [ ] Set production `STRIPE_SECRET_KEY`
- [ ] Configure Stripe webhooks
- [ ] Create Stripe products/prices
- [ ] Update code with Stripe price IDs
- [ ] Test full flow on staging environment
- [ ] Verify RLS policies in Supabase
- [ ] Check CORS settings for production domain
- [ ] Monitor error logs for first week
- [ ] Set up analytics for onboarding completion rate

---

## Support & Debugging

If issues persist:
1. Check browser console for errors
2. Check server logs for detailed error messages
3. Verify all environment variables are set
4. Review Supabase logs
5. Check Stripe dashboard for payment issues
6. Contact: info@freedomaviationco.com

