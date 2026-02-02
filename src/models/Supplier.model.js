const mongoose = require('mongoose');

const supplierProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        default: 0
    },
    pricePack: {
        type: Number,
        default: 0
    },
    unitsPerPack: {
        type: Number,
        default: 1
    },
    pricePallet: {
        type: Number,
        default: 0
    },
    unitsPerPallet: {
        type: Number,
        default: 1
    },
    priceCustom: {
        type: Number,
        default: 0
    },
    customQuantity: {
        type: Number,
        default: 1
    },
    comments: {
        type: String,
        trim: true
    },
    lastUpdate: {
        type: Date,
        default: Date.now
    }
}, { _id: true }); // We keep _id for easy individual product updates if needed

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre del proveedor es obligatorio'],
        trim: true,
        unique: true
    },
    contactPerson: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    address: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    products: [supplierProductSchema],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
