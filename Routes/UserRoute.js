const express = require('express');
const router = express.Router();

const UserController = require('../Controllers/UserController');

// import the Authentication middleware
const { protect } = require("../Middleware/Auth");

// import the Authorization middleware
const { authorize } = require("../Middleware/Role");

// define routes public routes
router.post('/createuser', UserController.createuser);
router.post("/loginuser", UserController.loginUser);

// Current logged-in user
router.get('/me', protect, UserController.getMe);

// Update the currently logged-in user's
// own email and password
router.put("/update-my-account", protect, UserController.updateMyAccount);

// ===============================
// ADMIN / MANAGER ROUTES
// ===============================
router.get('/getAllUser', protect, authorize('Admin', 'manager'), UserController.getAllUsers); // Get all users
router.get('/getUserById/:id', protect, authorize('Admin', 'manager'), UserController.getUserById); // Get a specific user
router.put('/updateUser/:id', protect, authorize('Admin' , 'manager'), UserController.updateUser); // Admin/manager updates another user
router.delete('/deleteUser/:id', protect, authorize('Admin' , 'manager'), UserController.deleteUser); // Admin/manager deletes another user

module.exports = router;

