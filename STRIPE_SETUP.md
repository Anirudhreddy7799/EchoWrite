# Stripe Webhook Setup Instructions

## Webhook Endpoint Configuration

When setting up your Stripe webhook in the Stripe Dashboard:

1. **Webhook URL**: `http://localhost:4000/webhook` (for development)

   - For production: `https://yourdomain.com/webhook`

2. **Events to listen for**:

   - `checkout.session.completed`

3. **After creating the webhook**:
   - Copy the webhook signing secret (starts with `whsec_`)
   - Update your `/server/.env` file:
     ```
     STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
     ```

## Testing Payments

- Your app is running at: http://localhost:5174/
- Backend server at: http://localhost:4000/
- Use Stripe test card: `4242 4242 4242 4242`
- Any future expiry date and CVC

## Current Configuration Status

✅ Secret Key: Updated in `/server/.env`
✅ Publishable Key: Updated in `/.env.local`
⚠️ Webhook Secret: Still needs to be updated after creating webhook in Stripe Dashboard
