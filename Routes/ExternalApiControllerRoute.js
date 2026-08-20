const express = require('express');
const {
	getInventory,
	getInventoryById,
	createInventory,
	updateInventory
} = require("../Controllers/ExternalApiController");

const router = express.Router();

router.get('/inventory', getInventory);
router.get('/inventory/:id', getInventoryById);
router.post('/inventory', createInventory);
router.put('/inventory/:id', updateInventory);

module.exports = router;