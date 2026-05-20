import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICES = {
  discipline: 'price_1TWU331TG84hD3oDCDMl9sRL',
  fitness:    'price_1TWU4F1TG84hD3oDgCVCtKyo',
  travel:     'price_1TWU4k1TG84hD3oD0MR6AmkY',
  income:     'price_1TWU5D1TG84hD3oDPp1g7DaV',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items in cart' });
    }

    const seen = new Set();
    const line_items = [];
    for (const id of items) {
      if (seen.has(id)) continue;
      seen.add(id);
      const price = PRICES[id];
      if (!price) {
        return res.status(400).json({ error: `Unknown item: ${id}` });
      }
      line_items.push({ price, quantity: 1 });
    }

    const origin = req.headers.origin || 'https://www.evlved.com';
    const productList = encodeURIComponent([...seen].join(','));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}&products=${productList}`,
      cancel_url: `${origin}/preview.html`,
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return res.status(500).json({ error: 'Checkout failed. Please try again.' });
  }
}
