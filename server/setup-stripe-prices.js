// server/setup-stripe-prices.js
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

async function createPrices() {
  try {
    // Create product first
    const product = await stripe.products.create({
      name: "EchoWrite Conversation Minutes",
      description: "Additional conversation time for EchoWrite",
    });

    // Create price for 60 minutes ($2.00)
    const price60 = await stripe.prices.create({
      unit_amount: 200, // $2.00 in cents
      currency: "usd",
      product: product.id,
      nickname: "60 Minutes Pack",
    });

    // Create price for 200 minutes ($5.00)
    const price200 = await stripe.prices.create({
      unit_amount: 500, // $5.00 in cents
      currency: "usd",
      product: product.id,
      nickname: "200 Minutes Pack",
    });

    console.log("✅ Created Stripe prices:");
    console.log(`60 minutes price ID: ${price60.id}`);
    console.log(`200 minutes price ID: ${price200.id}`);
    console.log("\nUpdate your BuyMinutes.jsx with these price IDs:");
    console.log(`purchase(60, "${price60.id}")`);
    console.log(`purchase(200, "${price200.id}")`);

  } catch (error) {
    console.error("Error creating prices:", error);
  }
}

createPrices();
