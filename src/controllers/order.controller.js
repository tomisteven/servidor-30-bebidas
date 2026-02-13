const Order = require('../models/Order.model');
const User = require('../models/User.model');

// @desc    Crear un nuevo pedido
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
    try {
        const itemsWithCost = await Promise.all(req.body.items.map(async (item) => {
            const product = await require('../models/Product.model').findById(item.product);
            return {
                ...item,
                costPrice: product ? product.precioCosto : 0
            };
        }));

        let userId = req.user ? req.user._id : null;

        // Permitir que el admin asigne el pedido a otro usuario (solo si el admin está autenticado)
        if (req.user && req.user.role === 'admin' && req.body.userId) {
            userId = req.body.userId;
        }

        const orderData = {
            ...req.body,
            items: itemsWithCost,
            user: userId
        };

        const order = await Order.create(orderData);

        // Opcional: Sumar puntos al usuario según la compra (solo si el usuario está registrado)
        if (req.user) {
            const pointsToEarn = Math.floor(req.body.total / 100);
            if (pointsToEarn > 0) {
                await User.findByIdAndUpdate(req.user._id, {
                    $inc: { points: pointsToEarn }
                });
            }
        }

        res.status(201).json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtener pedidos del usuario actual
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Obtener todos los pedidos (Admin)
// @route   GET /api/orders
// @access  Private/Admin
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'nombre email').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Actualizar estado del pedido (Admin)
// @route   PUT /api/orders/:id
// @access  Private/Admin
exports.updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
