# My Specs Store

Responsive React + Vite eyewear storefront with an Express + MongoDB API foundation.

## Frontend development

Requires Node.js 20+.

```bash
npm install
npm run dev
```

## Backend API

The API lives in `server/` and supports:
- `GET /api/health` — service and database status
- `GET /api/products` — active catalogue, with optional `type` and `q` query parameters
- `POST /api/orders` — validated Cash on Delivery order creation using database product prices and lens upgrades

The server recalculates prices from MongoDB rather than trusting totals sent by the browser. It validates customer data, product IDs, quantities and lens choices, applies a ₹99 shipping fee below ₹1,499, and stores the order in MongoDB. The initial API deliberately accepts **COD only**; online payments require a verified payment-provider integration and are not simulated as successful.

### Run the API locally (Windows PowerShell or terminal)

```bash
cd server
npm install
Copy-Item .env.example .env
```

Edit `server/.env` and set `MONGODB_URI`. For local MongoDB, the example URI is:

```text
mongodb://127.0.0.1:27017/my_specs_store
```

Then run:

```bash
npm run dev
```

In another terminal, seed the sample catalogue:

```bash
cd server
npm run seed
```

Check `http://localhost:5000/api/health`. A connected database should report `"database":"connected"`.

### Environment variables

- `PORT`: API port (defaults to 5000).
- `MONGODB_URI`: required database connection string. Keep it secret; never commit `.env`.
- `CLIENT_ORIGIN`: comma-separated exact frontend origins allowed by CORS, e.g. `http://localhost:5173,https://my-specs-store.vercel.app`. Avoid wildcard origins in production.

### Deploy

- Frontend: Vercel project root remains the repository root.
- API: deploy the `server/` directory to Render or another Node.js host, with start command `npm start`.
- Database: use MongoDB Atlas for a hosted database; set its network access rules and a strong database user password.
- Set `MONGODB_URI` and `CLIENT_ORIGIN` in the API host's environment settings. Never put database credentials in Vercel's `VITE_*` variables.

## Important status

The API is committed, but it is **not automatically deployed or connected to the live storefront yet**. Set `VITE_API_URL` in the Vercel frontend environment after deploying the API, and connect the storefront to the API before accepting customer orders. Until that integration and a real database are configured, the storefront's existing checkout remains a demo. No live online payment integration or admin dashboard is included in this step.

Before public sales, also add admin authentication, stock reservation/decrementing with concurrency protection, privacy/terms/returns pages, operational monitoring and verified payment processing. Sample catalogue photos are illustrative and must be replaced with licensed photos of actual inventory.
