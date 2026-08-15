const express = require('express');
const router = express.Router();

const UserController = require('../Controllers/UserController');

// import the authentication middleware
const { authorize } = require("../Middleware/Role");

// define routes for user-related operations
router.post('/createuser', UserController.createuser);
router.post("/loginuser", UserController.loginUser);

// // Current logged-in user
// router.get('/me', UserController.getMe);

// Users
router.get('/getAllUser', UserController.getAllUsers);
router.get('/getUserById/:id', UserController.getUserById);
router.put('/updateUser/:id', authorize('Admin' , 'manager'), UserController.updateUser);
router.delete('/deleteUser/:id', authorize('Admin' , 'manager'), UserController.deleteUser);

module.exports = router;