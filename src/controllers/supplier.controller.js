const Supplier = require('../models/Supplier.model');

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find().sort({ name: 1 });
        res.json({
            success: true,
            data: suppliers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener proveedores',
            error: error.message
        });
    }
};

// Get supplier by ID
exports.getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }
        res.json({
            success: true,
            data: supplier
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el proveedor',
            error: error.message
        });
    }
};

// Create new supplier
exports.createSupplier = async (req, res) => {
    try {
        const supplier = new Supplier(req.body);
        await supplier.save();
        res.status(201).json({
            success: true,
            data: supplier
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear el proveedor',
            error: error.message
        });
    }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
    try {
        // If updating products, update the lastUpdate timestamp for those products
        if (req.body.products) {
            req.body.products = req.body.products.map(product => ({
                ...product,
                lastUpdate: product.lastUpdate || Date.now()
            }));
        }

        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }

        res.json({
            success: true,
            data: supplier
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al actualizar el proveedor',
            error: error.message
        });
    }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'Proveedor no encontrado'
            });
        }
        res.json({
            success: true,
            message: 'Proveedor eliminado correctamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el proveedor',
            error: error.message
        });
    }
};
