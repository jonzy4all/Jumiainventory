const express = require('express');
const router = express.Router();

// Import the product controller
const productController = require('../Controllers/ProductController');

// Define the routes
router.post('/createProduct', productController.createProduct);
router.put('/updateProduct/:id', productController.updateProduct);
router.get('/getAllProducts', productController.getAllProducts);
router.get('/getProductById/:id', productController.getProductById);
router.delete('/deleteProduct/:id', productController.deleteProduct);

// Export the router
module.exports = router;