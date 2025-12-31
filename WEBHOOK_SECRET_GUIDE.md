# 🎯 Stripe Webhook Secret - Step by Step Guide

Based on your screenshot from https://dashboard.stripe.com/webhooks

## 📍 Exact Steps to Get Webhook Secret

### Method 1: Using Stripe CLI (Recommended for Development)

This is what you see in your screenshot - the "Set up a local listener" dialog.

**Steps:**

1. **Install Stripe CLI** (if not already installed)
   - Windows: Download from https://github.com/stripe/stripe-cli/releases/latest
   - Or use Scoop: `scoop install stripe`

2. **Login to Stripe**
   ```bash
   stripe login
   ```
   This will open your browser to authorize the CLI.

3. **Start the Listener**
   ```bash
   stripe listen --forward-to localhost:4242/webhook
   ```
   
   **For your app, use:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the Secret**
   When you run the command, you'll see:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
   ```
   
   **Copy everything starting with `whsec_`** - this is your webhook secret!

5. **Add to .env.local**
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
   ```

### Method 2: Creating a Webhook Endpoint in Dashboard (For Production)

**Steps:**

1. Go to: https://dashboard.stripe.com/webhooks

2. Click **"Add endpoint"** button (top right)

3. Fill in the form:
   - **Endpoint URL**: 
     - Development: `https://your-ngrok-url.ngrok.io/api/webhooks/stripe`
     - Production: `https://yourdomain.com/api/webhooks/stripe`
   
   - **Description**: "Production Payment Webhook" (optional)
   
   - **Events to send**: Click "Select events" and choose:
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`

4. Click **"Add endpoint"**

5. After creation, you'll see the endpoint details page

6. Scroll down to **"Signing secret"** section

7. Click **"Reveal"** or **"Click to reveal"** button

8. Copy the secret (starts with `whsec_`)

9. Add to your `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
   ```

---

## 🖥️ What You See in Your Screenshot

Your screenshot shows the **Workbench > Webhooks** testing interface with the local listener setup dialog.

**The 3 steps shown:**

1. **Download the Stripe CLI and log in with your Stripe account**
   ```bash
   stripe login
   ```

2. **Forward events to your destination**
   ```bash
   stripe listen --forward-to localhost:4242/webhook
   ```
   
   **Change to:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Trigger events with the CLI**
   ```bash
   stripe trigger payment_intent.succeeded
   ```

---

## ✅ Complete Setup for Your App

### Step 1: Install Stripe CLI

Download from: https://github.com/stripe/stripe-cli/releases/latest

Or on Windows with Scoop:
```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

### Step 2: Login

```bash
stripe login
```

This opens your browser to authorize. After authorization, you'll see:
```
> Done! The Stripe CLI is configured for [your account]
```

### Step 3: Start Forwarding Webhooks

Open a NEW terminal window (keep it running while testing):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**You will see:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
```

**COPY THIS SECRET!** This is what you need for `.env.local`

### Step 4: Create .env.local

Create `e:\soliel-ai\.env.local`:

```bash
# Supabase Configuration (you already have these)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration (ADD THESE)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxx  # From https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_51xxxxx                   # From https://dashboard.stripe.com/apikeys
STRIPE_WEBHOOK_SECRET=whsec_xxxxx                   # From stripe listen command

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Start Your App

Open another terminal:

```bash
cd e:\soliel-ai
npm run dev
```

### Step 6: Test!

1. Go to: http://localhost:3000
2. Find a course and click "Enroll"
3. Use test card: `4242 4242 4242 4242`
4. Expiry: `12/34`, CVC: `123`
5. Click "Pay"

**Check the Stripe CLI terminal - you should see:**
```
2024-12-31 09:00:00   --> payment_intent.succeeded [evt_xxxxx]
2024-12-31 09:00:00   <-- [200] POST http://localhost:3000/api/webhooks/stripe [evt_xxxxx]
```

✅ Success! The webhook was delivered!

---

## 🔍 Troubleshooting

### "Command not found: stripe"

**Solution**: Install Stripe CLI
- Windows: Download from https://github.com/stripe/stripe-cli/releases/latest
- Add to PATH or use full path

### "Invalid API key provided"

**Solution**: Run `stripe login` again

### "Connection refused"

**Solution**: Make sure your app is running on `localhost:3000`
```bash
npm run dev
```

### "Webhook signature verification failed"

**Solutions**:
1. Copy the ENTIRE secret from `stripe listen` output (starts with `whsec_`)
2. Make sure it's in `.env.local` file
3. Restart your dev server after adding the secret
4. Ensure no extra spaces or quotes around the secret

---

## 📊 Understanding Webhook Events

When a payment succeeds, Stripe sends:

```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxxxx",
      "amount": 2999,  // $29.99 in cents
      "currency": "usd",
      "status": "succeeded",
      "metadata": {
        "courseId": "xxx",
        "userId": "xxx"
      }
    }
  }
}
```

Your webhook handler (`app/api/webhooks/stripe/route.ts`) automatically:
1. Verifies the signature
2. Creates an order
3. Creates a payment record
4. Enrolls the user in the course
5. Creates instructor earning record

---

## 🎯 Quick Reference

| What | Where |
|------|-------|
| **API Keys** | https://dashboard.stripe.com/apikeys |
| **Webhooks Dashboard** | https://dashboard.stripe.com/webhooks |
| **Test Cards** | https://stripe.com/docs/testing |
| **CLI Download** | https://github.com/stripe/stripe-cli/releases |
| **Webhook Endpoint (Local)** | `http://localhost:3000/api/webhooks/stripe` |

---

## 🚀 Ready to Go!

You now have everything you need:
- ✅ Stripe integration implemented
- ✅ Webhook handler configured
- ✅ Payment form with Stripe Elements
- ✅ Complete documentation

**Next:** Just add your keys to `.env.local` and start testing! 🎉
