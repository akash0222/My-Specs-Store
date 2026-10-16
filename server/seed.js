import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: new URL("./.env", import.meta.url).pathname });

const schema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  type: { type: String, required: true, enum: ["Optical", "Sunglasses", "Blue Light"] },
  price: { type: Number, required: true, min: 0 },
  oldPrice: { type: Number, default: null, min: 0 },
  color: { type: String, required: true },
  shape: { type: String, required: true },
  tag: { type: String, default: "NEW" },
  image: { type: String, required: true },
  description: { type: String, default: "" },
  stock: { type: Number, default: 10, min: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });
const Product = mongoose.models.Product || mongoose.model("Product", schema);

const products = [
  { sku: "MSS-OPT-001", name: "The Everyday", type: "Optical", price: 1499, oldPrice: 1999, color: "Tortoise", shape: "Rectangle", tag: "BESTSELLER", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85", description: "An easy everyday frame.", stock: 20 },
  { sku: "MSS-OPT-002", name: "Studio Round", type: "Optical", price: 1799, oldPrice: 2299, color: "Black", shape: "Round", tag: "NEW", image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=900&q=85", description: "A modern round silhouette.", stock: 15 },
  { sku: "MSS-SUN-001", name: "Sunday Club", type: "Sunglasses", price: 2199, oldPrice: 2799, color: "Amber", shape: "Square", tag: "TRENDING", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85", description: "Weekend-ready sunglasses.", stock: 12 },
  { sku: "MSS-OPT-003", name: "The Minimalist", type: "Optical", price: 1299, oldPrice: 1699, color: "Silver", shape: "Aviator", tag: "EVERYDAY", image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=900&q=85", description: "A light, versatile frame.", stock: 18 },
  { sku: "MSS-SUN-002", name: "After Hours", type: "Sunglasses", price: 2499, oldPrice: 3199, color: "Black", shape: "Rectangle", tag: "PREMIUM", image: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=900&q=85", description: "A bold statement frame.", stock: 8 },
  { sku: "MSS-BLU-001", name: "Soft Focus", type: "Blue Light", price: 1599, oldPrice: 1999, color: "Champagne", shape: "Cat Eye", tag: "SCREEN READY", image: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=900&q=85", description: "Screen-time style.", stock: 10 },
  { sku: "MSS-SUN-003", name: "City Explorer", type: "Sunglasses", price: 1999, oldPrice: 2599, color: "Olive", shape: "Aviator", tag: "FAVOURITE", image: "https://images.unsplash.com/photo-1519183071298-a2962be90b8e?auto=format&fit=crop&w=900&q=85", description: "A classic aviator look.", stock: 10 },
  { sku: "MSS-OPT-004", name: "Sunday Reading", type: "Optical", price: 999, oldPrice: 1399, color: "Brown", shape: "Round", tag: "UNDER ₹1,000", image: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=900&q=85", description: "A simple, timeless frame.", stock: 14 }
];

if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI. Configure server/.env first.");
  process.exit(1);
}
try {
  await mongoose.connect(process.env.MONGODB_URI);
  const operations = products.map((product) => ({
    updateOne: { filter: { sku: product.sku }, update: { $set: product }, upsert: true }
  }));
  const result = await Product.bulkWrite(operations);
  console.log("Catalogue seeded:", result.upsertedCount, "inserted,", result.modifiedCount, "updated.");
} catch (error) {
  console.error("Seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
