require("dotenv").config();

const bcrypt = require("bcryptjs");
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// --- 1. CLOUDINARY CONFIG ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "ds-clothing",
    allowedFormats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({ storage: storage });

// --- 2. MIDDLEWARE (The Bouncers) ---

// Admin Bouncer
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "No token provided." });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token." });
    req.user = user;
    next();
  });
};

// Customer Bouncer
const authenticateCustomer = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_CUSTOMER_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.customer = decoded; // Contains { id, email }
    next();
  });
};

// --- 3. AUTH ROUTES ---

// Admin Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user)
    return res
      .status(401)
      .json({ success: false, message: "Invalid Credentials" });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res
      .status(401)
      .json({ success: false, message: "Invalid Credentials" });

  const token = jwt.sign(
    { userId: user.id, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    success: true,
    token,
    user: { name: user.name, email: user.email },
  });
});

// Customer Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const customer = await prisma.customer.create({
      data: { name, email, password: hashedPassword },
    });

    const token = jwt.sign(
      { id: customer.id, email: customer.email },
      process.env.JWT_CUSTOMER_SECRET
    );

    // CRITICAL: We now send the 'id' back so the frontend can store it!
    res.status(201).json({
      success: true,
      token,
      customer: { id: customer.id, name: customer.name, email: customer.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Registration failed" });
  }
});

// Customer Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) return res.status(404).json({ message: "User not found" });

    const isValid = await bcrypt.compare(password, customer.password);
    if (!isValid)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: customer.id, email: customer.email },
      process.env.JWT_CUSTOMER_SECRET
    );

    // CRITICAL: We now send the 'id' back!
    res.json({
      success: true,
      token,
      customer: { id: customer.id, name: customer.name, email: customer.email },
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

// --- 4. PRODUCT ROUTES ---

app.get("/api/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to load collection" });
  }
});

app.post(
  "/api/products",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const imageUrl = req.file.path;
      const { name, price, category, description, gender } = req.body;

      const newProduct = await prisma.product.create({
        data: {
          name,
          price: parseInt(price),
          category,
          description,
          image: imageUrl,
          gender,
        },
      });
      res.status(201).json({ success: true, product: newProduct });
    } catch (error) {
      console.error("Product upload error:", error);
      res.status(500).json({ success: false, message: "Upload failed" });
    }
  }
);

// --- 5. ORDER ROUTES ---

// Place a New Order (Guest or Member)
app.post("/api/orders", async (req, res) => {
  try {
    const { customerName, email, totalAmount, customerId } = req.body;

    const newOrder = await prisma.order.create({
      data: {
        customerName,
        email,
        totalAmount: parseInt(totalAmount),
        // Force the ID to a Number to match the Int field in schema
        customerId: customerId ? Number(customerId) : null,
      },
    });

    res.status(201).json({ success: true, orderId: newOrder.id });
  } catch (error) {
    console.error("Order Creation Error:", error);
    res.status(500).json({ message: "Order failed" });
  }
});

// Fetch All Orders (Admin Only)
app.get("/api/orders", authenticateToken, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to load orders" });
  }
});

// Fetch History for Logged-in Customer
app.get("/api/customer/orders", authenticateCustomer, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId: req.customer.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

// Status Route
app.get("/api/status", (req, res) => {
  res.json({ message: "DS Clothing Engine is LIVE!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server live on port ${PORT}`);
});
