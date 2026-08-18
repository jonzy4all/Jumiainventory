const express = require('express');
const router = express.Router();

// import the authentication middleware
const { protect } = require("../Middleware/Auth");

// Import the authorization middleware
const { authorize } = require("../Middleware/Role");

// Import the upload middleware
const upload = require("../Middleware/upload"); 

// Import the product controller
const productController = require('../Controllers/ProductController');

// Define the routes
router.post('/createProduct', protect, authorize('storekeeper' , 'Admin' , 'manager'), upload.single("image"), productController.createProductwithimage);
router.put('/updateProduct/:id', protect, authorize('storekeeper' , 'Admin' , 'manager'), productController.updateProduct);
router.get('/getAllProducts', productController.getAllProducts);
router.get('/getProductById/:id', productController.getProductById);
router.delete('/deleteProduct/:id', protect, authorize('Admin' , 'manager'), productController.deleteProduct);


// Export the router
module.exports = router;