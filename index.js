const express = require("express");
const app = express();
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Database connection
const connectDB = require("./Config/databaseconfig");

// Connect to MongoDB
connectDB();


const productRoutes = require("./Routes/ProductRoutes");

// Middleware
app.use(express.json());

// Routes
app.use("/products", productRoutes);

// Port
const PORT = process.env.PORT || 8000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});