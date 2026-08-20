const express = require("express");
const dotenv = require("dotenv");

// Load environment variables FIRST
dotenv.config();

const app = express();

// Database connection
const connectDB = require("./Config/databaseconfig");

// Routes
const inventoryRoutes = require("./Routes/ExternalApiControllerRoute");
const productRoutes = require("./Routes/ProductRoutes");
const userRoutes = require("./Routes/UserRoute");

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// API Routes
app.use("/api", inventoryRoutes);
app.use("/products", productRoutes);
app.use("/users", userRoutes);

// Home route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Inventory API is running",
    routes: {
      inventory: "/api/inventory",
      products: "/products",
      users: "/users",
    },
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Port
const PORT = process.env.PORT || 8000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Inventory API: http://localhost:${PORT}`);
});