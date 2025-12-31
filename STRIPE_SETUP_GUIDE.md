# Stripe Integration Setup Guide

This guide will walk you through setting up Stripe payment integration for your LMS platform.

## 🎯 Overview

Your application now has **complete Stripe integration** with:
- ✅ Real payment processing with Stripe Elements
- ✅ Secure webhook handling for payment confirmations
- ✅ Automatic enrollment after successful payment
- ✅ Instructor earnings tracking
- ✅ Order and payment records in database

---

## 📋 Prerequisites

1. **Stripe Account**: You mentioned you have real Stripe keys
2. **Supabase Service Role Key**: Required for webhook handler
3. **Your Application**: Running on `http://localhost:3000` for development

---

## 🔑 Step 1: Get Your Stripe API Keys

### 1.1 Publishable Key and Secret Key

1. Go to [Stripe Dashboard API Keys](https://dashboard.stripe.com/apikeys)
2. You'll see two keys:
   - **Publishable key** (starts with `pk_live_...` for production or `pk_test_...` for test)
   - **Secret key** (starts with `sk_live_...` for production or `sk_test_...` for test)

**⚠️ IMPORTANT**: 
- For **development/testing**, use **TEST** keys (`pk_test_...` and `sk_test_...`)
- For **production**, use **LIVE** keys (`pk_live_...` and `sk_live_...`)

### 1.2 Test Cards for Development

When using test mode, you can use these test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0025 0000 3155`
- Use any future expiry date (e.g., `12/34`)
- Use any 3-digit CVC (e.g., `123`)

---

## 🔗 Step 2: Set Up Webhook Endpoint

Webhooks are **CRITICAL** - they notify your app when payments succeed or fail.

### 2.1 For Local Development (Using Stripe CLI)

#### Install Stripe CLI

**Windows (using Scoop)**:
```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Or download directly**: https://github.com/stripe/stripe-cli/releases/latest

#### Login and Forward Webhooks

```bash
# Login to your Stripe account
stripe login

# Forward webhooks to your local server
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

This command will output a **webhook signing secret** like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**Copy this secret** - you'll need it for your `.env.local` file!

### 2.2 For Production Deployment

1. Go to [Stripe Webhooks Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter your endpoint URL:
   ```
   https://your-domain.com/api/webhooks/stripe
   ```
4. Select events to listen to:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_...`)

#### Where to Find Webhook Secret in Dashboard

After creating the webhook:
1. Go to https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Click **"Reveal"** next to "Signing secret"
4. Copy the secret (format: `whsec_xxxxxxxxxxxxx`)

---

## ⚙️ Step 3: Configure Environment Variables

Create or update your `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key  # Use pk_live_ for production
STRIPE_SECRET_KEY=sk_test_your_secret_key                        # Use sk_live_ for production
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ CRITICAL**: 
- Never commit `.env.local` to version control
- The `SUPABASE_SERVICE_ROLE_KEY` is needed for the webhook handler to bypass RLS
- The webhook secret must match what Stripe sends

---

## 🧪 Step 4: Test the Integration

### 4.1 Start Your Development Server

```bash
npm run dev
```

### 4.2 Start Stripe CLI (in a separate terminal)

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

### 4.3 Test a Payment

1. Navigate to a course page (e.g., `http://localhost:3000/courses/[courseId]`)
2. Click "Enroll" or "Buy Now"
3. On the checkout page, use test card: `4242 4242 4242 4242`
4. Fill in:
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
5. Click "Pay"

### 4.4 Verify Success

**What should happen:**
1. ✅ Payment processes successfully
2. ✅ Stripe sends webhook to your app
3. ✅ Webhook creates:
   - Order record
   - Payment record
   - Enrollment record
   - Instructor earning record
4. ✅ User is redirected to course player
5. ✅ User can access the course content

**Check the Stripe CLI output:**
```
payment_intent.succeeded [evt_xxxxx]
```

**Check your terminal/console for:**
```
Payment succeeded: pi_xxxxx
Successfully processed payment and created enrollment
```

---

## 🏗️ Architecture Overview

### Payment Flow

```
User clicks "Pay"
    ↓
Frontend creates Payment Intent via /api/create-payment-intent
    ↓
Stripe Elements handles card input securely
    ↓
User confirms payment
    ↓
Stripe processes payment
    ↓
Stripe sends webhook to /api/webhooks/stripe
    ↓
Webhook handler creates:
  - Order
  - Payment record
  - Enrollment
  - Instructor earning
    ↓
User is redirected to course
```

### Files Created/Modified

```
lib/
  └── stripe.ts                              # Stripe initialization & helpers

app/api/
  ├── create-payment-intent/
  │   └── route.ts                          # Creates Stripe payment intent
  └── webhooks/stripe/
      └── route.ts                          # Handles Stripe webhook events

components/forms/
  └── CheckoutForm.tsx                      # Updated with real Stripe Elements

.env.local.example                          # Environment variable template
```

---

## 🔒 Security Best Practices

### ✅ Do's

1. **Never expose secret keys**: Only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` should be in client code
2. **Verify webhook signatures**: Always verify webhook signatures to prevent fake requests
3. **Use HTTPS in production**: Stripe requires HTTPS for production webhooks
4. **Store keys in environment variables**: Never hardcode keys
5. **Use different keys for dev/prod**: Keep test and live environments separate

### ❌ Don'ts

1. **Don't commit `.env.local`**: Add it to `.gitignore`
2. **Don't use live keys in development**: Use test keys for testing
3. **Don't skip webhook signature verification**: Your webhook handler already does this
4. **Don't trust client-side payment amounts**: Server validates amounts

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Set up production webhook endpoint in Stripe Dashboard
- [ ] Update environment variables with **LIVE** keys (`pk_live_...`, `sk_live_...`)
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production webhook secret
- [ ] Ensure your app uses HTTPS
- [ ] Test webhook delivery in production
- [ ] Enable Stripe Radar for fraud protection
- [ ] Set up email notifications for failed payments

---

## 🐛 Troubleshooting

### Payment Intent Creation Fails

**Error**: "STRIPE_SECRET_KEY is not set"
- **Solution**: Ensure `.env.local` has `STRIPE_SECRET_KEY` set

**Error**: "Unauthorized"
- **Solution**: User must be logged in to create payment intent

### Webhook Not Receiving Events

**Issue**: Payment succeeds but no enrollment created
- **Check**: Is Stripe CLI running? (`stripe listen --forward-to ...`)
- **Check**: Is webhook URL correct?
- **Check**: Check Stripe Dashboard → Webhooks → Event logs

**Error**: "Webhook signature verification failed"
- **Solution**: Ensure `STRIPE_WEBHOOK_SECRET` matches the one from Stripe

### Enrollment Not Created

**Issue**: Payment succeeds, webhook received, but enrollment fails
- **Check**: Database logs in terminal
- **Check**: Supabase logs for RLS policy issues
- **Verify**: `SUPABASE_SERVICE_ROLE_KEY` is set (bypasses RLS)

### Test Cards Not Working

**Issue**: Test cards are declined
- **Verify**: Using test mode keys (`pk_test_...`, `sk_test_...`)
- **Try**: Different test card from [Stripe's test cards list](https://stripe.com/docs/testing)

---

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Elements Guide](https://stripe.com/docs/payments/elements)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)

---

## 💡 Quick Reference

### Environment Variables Location
```
Project Root
  └── .env.local  ← Create this file here
```

### Stripe Dashboard Links
- **API Keys**: https://dashboard.stripe.com/apikeys
- **Webhooks**: https://dashboard.stripe.com/webhooks
- **Payments**: https://dashboard.stripe.com/payments
- **Test Cards**: https://stripe.com/docs/testing

### Webhook Endpoint (Production)
```
https://your-domain.com/api/webhooks/stripe
```

### Webhook Events to Monitor
- `payment_intent.succeeded` ← Most important
- `payment_intent.payment_failed`

---

## ✅ Summary

You now have:
1. ✅ Full Stripe integration with real payment processing
2. ✅ Secure webhook handling
3. ✅ Automatic enrollment after payment
4. ✅ Instructor earnings tracking
5. ✅ Order and payment records

**Next Steps:**
1. Add your Stripe keys to `.env.local`
2. Start Stripe CLI for local testing
3. Test a payment with test card `4242 4242 4242 4242`
4. Verify enrollment is created
5. Deploy to production when ready!

---

**Need Help?** Check the troubleshooting section above or reach out to your team!
