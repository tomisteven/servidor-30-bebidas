const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus
} = require('../controllers/order.controller');
const { protect, optionalProtect, authorize } = require('../middlewares/auth.middleware');

router.post('/', optionalProtect, createOrder);
router.use(protect);
router.get('/my-orders', getMyOrders);

router.get('/', authorize('admin'), getAllOrders);
router.put('/:id', authorize('admin'), updateOrderStatus);

module.exports = router;
