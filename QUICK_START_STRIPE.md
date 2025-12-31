# 🚀 Quick Start - Stripe Integration

## Step-by-Step Setup (5 Minutes)

### 1️⃣ Get Stripe Keys

Go to: https://dashboard.stripe.com/apikeys

Copy:
- **Publishable Key** (pk_test_... for testing)
- **Secret Key** (sk_test_... for testing)

### 2️⃣ Get Webhook Secret

**For Local Development:**

Install Stripe CLI and run:
```bash
stripe login
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` secret shown in the output.

**For Production:**

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the signing secret from webhook details

### 3️⃣ Create .env.local File

Create `e:\soliel-ai\.env.local` with:

```bash
# Supabase (you already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (ADD THESE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4️⃣ Test It!

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

**Browser:**
1. Go to any course
2. Click "Enroll"
3. Use test card: `4242 4242 4242 4242`
4. Expiry: `12/34`, CVC: `123`, ZIP: `12345`
5. Click Pay
6. ✅ You should be enrolled!

---

## 📍 Where to Find Webhook Secret

### Stripe Dashboard Method:

1. Navigate to: https://dashboard.stripe.com/webhooks
2. You'll see a list of webhook endpoints
3. Click on your endpoint
4. Look for "Signing secret" section
5. Click "Reveal" button
6. Copy the secret (format: `whsec_xxxxxxxxxxxxx`)

### Visual Guide:

```
Stripe Dashboard
  └── Webhooks (in left sidebar)
      └── Your endpoint (click to open)
          └── Signing secret section
              └── [Reveal] button ← Click here
                  └── whsec_... ← Copy this!
```

---

## 🧪 Test Cards

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Card declined |
| `4000 0025 0000 3155` | 🔐 Requires 3D Secure |

Use any:
- Future expiry date (e.g., `12/34`)
- 3-digit CVC (e.g., `123`)
- 5-digit ZIP (e.g., `12345`)

---

## ✅ What Was Implemented

### New Files:
- ✅ `lib/stripe.ts` - Stripe configuration
- ✅ `app/api/create-payment-intent/route.ts` - Creates payment
- ✅ `app/api/webhooks/stripe/route.ts` - Handles webhook events
- ✅ `STRIPE_SETUP_GUIDE.md` - Complete documentation

### Updated Files:
- ✅ `components/forms/CheckoutForm.tsx` - Real Stripe Elements UI
- ✅ `.env.local.example` - Environment template

### What Happens on Payment:
1. User enters card details (Stripe Elements)
2. Payment processes securely
3. Stripe sends webhook
4. Your app creates:
   - ✅ Order record
   - ✅ Payment record
   - ✅ Enrollment
   - ✅ Instructor earning (70% of payment)
5. User redirected to course

---

## 🆘 Common Issues

**"Cannot find Stripe keys"**
→ Check `.env.local` file exists and has correct keys

**"Webhook signature failed"**
→ Ensure `STRIPE_WEBHOOK_SECRET` matches Stripe CLI output or dashboard

**"Payment succeeds but no enrollment"**
→ Check Stripe CLI is running: `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`

**"Test card doesn't work"**
→ Ensure using TEST keys (pk_test_..., sk_test_...)

---

## 🎯 Production Checklist

Before going live:

- [ ] Switch to LIVE Stripe keys (pk_live_..., sk_live_...)
- [ ] Create production webhook in Stripe Dashboard
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production secret
- [ ] Ensure app uses HTTPS
- [ ] Test with real payment methods
- [ ] Enable Stripe Radar (fraud protection)

---

## 📞 Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Test Cards**: https://stripe.com/docs/testing
- **Webhook Guide**: https://stripe.com/docs/webhooks
- **Stripe CLI**: https://stripe.com/docs/stripe-cli

---

**You're all set! 🎉**

Just add your Stripe keys to `.env.local` and start the Stripe CLI!
