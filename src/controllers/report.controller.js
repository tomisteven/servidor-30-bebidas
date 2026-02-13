const Order = require('../models/Order.model');
const Product = require('../models/Product.model');

// @desc    Obtener estadísticas generales (Ventas totales, Ganancia estimada, Valor stock)
// @route   GET /api/reports/stats
// @access  Pixel/Admin
exports.getGeneralStats = async (req, res) => {
    try {
        // 1. Calcular Ventas Totales y Ganancia
        // Consideramos solo pedidos 'entregado' o todos menos 'cancelado'? 
        // Generalmente ventas = pedidos completados o pagados.
        // Vamos a tomar todos los que NO estén cancelados para "Ventas Generadas"
        // O tal vez solo 'entregado'. Por ahora usemos { status: { $ne: 'cancelado' } }

        const orders = await Order.find({ status: { $ne: 'cancelado' } });

        let totalSales = 0;
        let totalCost = 0;
        let totalOrders = orders.length;

        orders.forEach(order => {
            totalSales += order.total;
            
            // Calcular costo de la orden
            if (order.items) {
                order.items.forEach(item => {
                    // Si el item tiene costPrice guardado, lo usamos
                    // Si no (pedidos viejos), tratamos de estimar o lo ignoramos (será 0)
                    const cost = item.costPrice || 0;
                    totalCost += cost * item.quantity;
                });
            }
        });

        const totalProfit = totalSales - totalCost;

        // 2. Calcular Valor del Stock Actual
        // Necesitamos recorrer todos los productos y sumar (stock * precioCosto)
        const products = await Product.find({ isDeleted: false }).select('+precioCosto');
        
        let totalStockValue = 0;
        let totalStockUnits = 0;

        products.forEach(product => {
            const cost = product.precioCosto || 0;
            const stock = product.stock || 0;
            totalStockValue += stock * cost;
            totalStockUnits += stock;
        });

        res.json({
            success: true,
            data: {
                totalSales,
                totalProfit,
                totalOrders,
                totalStockValue,
                totalStockUnits,
                averageTicket: totalOrders > 0 ? (totalSales / totalOrders) : 0
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Obtener ventas en el tiempo (para gráfico)
// @route   GET /api/reports/sales-history
// @access  Pixel/Admin
exports.getSalesOverTime = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - parseInt(days));

        const sales = await Order.aggregate([
            {
                $match: {
                    status: { $ne: 'cancelado' },
                    createdAt: { $gte: dateLimit }
                }
            },
            {
                $project: {
                    createdAt: 1,
                    total: 1,
                    // Calcular ganancia por orden (total - costo)
                    // Asumimos que los items tienen costPrice
                    profit: {
                        $subtract: [
                            "$total",
                            {
                                $reduce: {
                                    input: "$items",
                                    initialValue: 0,
                                    in: { $add: ["$$value", { $multiply: [{ $ifNull: ["$$this.costPrice", 0] }, "$$this.quantity"] }] }
                                }
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: { $sum: "$total" },
                    profit: { $sum: "$profit" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: sales
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Obtener productos más vendidos
// @route   GET /api/reports/top-products
// @access  Pixel/Admin
exports.getTopProducts = async (req, res) => {
    try {
        const topProducts = await Order.aggregate([
            { $match: { status: { $ne: 'cancelado' } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    nombre: { $first: "$items.nombre" },
                    totalSold: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.precio"] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            data: topProducts
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
