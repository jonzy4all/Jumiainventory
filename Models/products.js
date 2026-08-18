const mongoose = require('mongoose');

// Product Schema
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  inStock: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    enum: [],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: false
    
  }
}, 
{timestamps: true} // Date created and updated timestamps will be automatically added to the schema
); 

// Create model from the schema
const Product = mongoose.model('Product', ProductSchema);

module.exports = Product; // Export the Product model for use in other files

