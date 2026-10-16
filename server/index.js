import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const MONGODB_URI = process.env.MONGODB_URI;
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "100kb" }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: "draft-7", legacyHeaders: false }));

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  type: { type: String, required: true, enum: ["Optical", "Sunglasses", "Blue Light"] },
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, default: null, min: 0 },
  color: { type: String, required: true, trim: true },
  shape: { type: String, required: true, trim: true },
  tag: { type: String, default: "NEW", trim: true },
  image: { type: String, required: true },
  description: { type: String, default: "" },
  stock: { type: Number, default: 10, min: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  unitPrice: { type: Number, required: true, min: 0 },
  lens: { type: String, enum: ["Frame only", "Blue-light lens", "Prescription lens"], default: "Frame only" },
  lensPrice: { type: Number, default: 0, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 10 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    pin: { type: String, required: true }
  },
  items: { type: [orderItemSchema], required: true, validate: [(items) => items.length > 0, "Order must contain at least one item"] },
  subtotal: { type: Number, required: true, min: 0 },
  shipping: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["cod"], default: "cod" },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  orderStatus: { type: String, enum: ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled"], default: "placed" }
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "my-specs-store-api",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.get("/api/products", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: "Product service is not connected to the database yet." });
    const filter = { active: true };
    if (["Optical", "Sunglasses", "Blue Light"].includes(req.query.type)) filter.type = req.query.type;
    if (req.query.q && typeof req.query.q === "string") {
      const escaped = req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 80);
      if (escaped) filter.$or = [{ name: { $regex: escaped, $options: "i" } }, { color: { $regex: escaped, $options: "i" } }, { shape: { $regex: escaped, $options: "i" } }];
    }
    const products = await Product.find(filter).select("-__v").sort({ createdAt: -1 }).limit(100).lean();
    res.json({ products });
  } catch (error) { next(error); }
});

const validEmail = (value) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(value);
const validPhone = (value) => /^[6-9][0-9]{9}$/.test(value);
const validPin = (value) => /^[0-9]{6}$/.test(value);
const lensPrices = { "Frame only": 0, "Blue-light lens": 499, "Prescription lens": 999 };

app.post("/api/orders", async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: "Ordering is temporarily unavailable. Please try again later." });
    const body = req.body || {};
    const customer = body.customer || {};
    const errors = [];
    if (typeof customer.name !== "string" || customer.name.trim().length < 2 || customer.name.trim().length > 100) errors.push("Enter a valid full name.");
    if (typeof customer.phone !== "string" || !validPhone(customer.phone)) errors.push("Enter a valid 10-digit Indian mobile number.");
    if (typeof customer.email !== "string" || !validEmail(customer.email.trim())) errors.push("Enter a valid email address.");
    if (typeof customer.address !== "string" || customer.address.trim().length < 8 || customer.address.trim().length > 500) errors.push("Enter a complete delivery address.");
    if (typeof customer.city !== "string" || !/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]{1,59}$/.test(customer.city.trim())) errors.push("Enter a valid city.");
    if (typeof customer.pin !== "string" || !validPin(customer.pin)) errors.push("Enter a valid 6-digit PIN code.");
    if (body.paymentMethod !== "cod") errors.push("Only Cash on Delivery is enabled. Online payments are not yet configured.");
    if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 20) errors.push("An order must contain between 1 and 20 line items.");
    if (errors.length) return res.status(400).json({ message: errors[0], errors });

    const requestedIds = [...new Set(body.items.map((item) => String(item.productId || "")))];
    if (requestedIds.some((id) => !mongoose.isValidObjectId(id))) return res.status(400).json({ message: "One or more products are invalid. Refresh the catalogue and try again." });
    const products = await Product.find({ _id: { $in: requestedIds }, active: true }).lean();
    const byId = new Map(products.map((product) => [String(product._id), product]));
    const items = [];
    let subtotal = 0;
    for (const requested of body.items) {
      const product = byId.get(String(requested.productId));
      const quantity = Number(requested.quantity);
      const lens = requested.lens || "Frame only";
      if (!product) return res.status(400).json({ message: "A selected product is no longer available." });
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return res.status(400).json({ message: "Each item quantity must be between 1 and 10." });
      if (!Object.hasOwn(lensPrices, lens)) return res.status(400).json({ message: "A selected lens option is invalid." });
      if (product.stock < quantity) return res.status(409).json({ message: "Insufficient stock for " + product.name + "." });
      const lensPrice = lensPrices[lens];
      const unitTotal = product.price + lensPrice;
      subtotal += unitTotal * quantity;
      items.push({ productId: product._id, sku: product.sku, name: product.name, type: product.type, unitPrice: product.price, lens, lensPrice, quantity });
    }

    const shipping = subtotal >= 1499 ? 0 : 99;
    const orderNumber = "MSS-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const order = await Order.create({
      orderNumber,
      customer: { name: customer.name.trim(), phone: customer.phone, email: customer.email.trim().toLowerCase(), address: customer.address.trim(), city: customer.city.trim(), pin: customer.pin },
      items, subtotal, shipping, total: subtotal + shipping, paymentMethod: "cod", paymentStatus: "pending", orderStatus: "placed"
    });
    res.status(201).json({ message: "Order saved successfully.", order: { orderNumber: order.orderNumber, subtotal: order.subtotal, shipping: order.shipping, total: order.total, paymentMethod: order.paymentMethod, orderStatus: order.orderStatus, createdAt: order.createdAt } });
  } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ message: "API route not found." }));
app.use((error, _req, res, _next) => {
  if (error.message === "Origin is not allowed by CORS") return res.status(403).json({ message: "This website is not allowed to access the API." });
  if (error.name === "ValidationError") return res.status(400).json({ message: "Submitted data is invalid." });
  if (error.code === 11000) return res.status(409).json({ message: "A duplicate record was detected." });
  console.error("API error:", error.message);
  res.status(500).json({ message: "An unexpected server error occurred." });
});

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI. Copy server/.env.example to server/.env and configure the database connection.");
  process.exit(1);
}
mongoose.connect(MONGODB_URI).then(() => {
  console.log("MongoDB connected.");
  app.listen(PORT, () => console.log("My Specs Store API listening on port " + PORT));
}).catch((error) => {
  console.error("Could not connect to MongoDB:", error.message);
  process.exit(1);
});
