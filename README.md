# My Specs Store

A responsive React + Vite eyewear storefront starter.

## Included
- Responsive storefront with hero, categories, product grid and brand story
- Search, category filters and price sorting
- Wishlist toggle
- Lens option selector (presentation only; upgrades are not added to price yet)
- Cart with quantity controls and subtotal
- Checkout form validation and demo order confirmation
- Cash on delivery demo option
- Online-payment placeholder clearly marked as not enabled
- Demo badge to avoid confusing this starter with a live shop

## Run locally
Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production status — read before launch
This is a **frontend demo**, not a live commerce system.
- Products are hardcoded in `src/main.jsx`.
- Cart, wishlist and demo orders live only in React memory and disappear on refresh.
- Checkout does not send orders to a server.
- No customer information is stored or transmitted by this starter.
- Razorpay/UPI/card payments are not connected. Do not collect card details in a custom form.
- Inventory, shipping rates, tax invoices, email/SMS notifications, order tracking, returns and admin management are not implemented.
- Product photos are loaded from Unsplash URLs and require an internet connection; replace with licensed photos of actual inventory before selling.

## Before accepting real orders
1. Add an API (e.g. Node.js + Express) and persistent database (e.g. MongoDB).
2. Add admin authentication and server-side product/stock/order management.
3. Create orders server-side with validated prices, shipping, tax and lens upgrades.
4. Integrate Razorpay Checkout on the server with order creation and signature verification. Never trust a browser-only payment success event.
5. Add privacy policy, terms, shipping/returns policy, customer support and business details.
6. Configure production environment variables, HTTPS, backups, logging and test payment flows in sandbox mode.

## Suggested deployment
- Frontend: Vercel (Vite preset)
- API: Render or another Node host
- Database: MongoDB Atlas
