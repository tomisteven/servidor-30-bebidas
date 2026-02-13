const mongoose = require('mongoose');

const bulkPriceSchema = new mongoose.Schema({
    minQuantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const wholesaleOptionSchema = new mongoose.Schema({
    available: {
        type: Boolean,
        default: false
    },
    price: {
        type: Number,
        min: 0
    },
    itemsPerUnit: { // En caso de packs o pallets, cuántas unidades contiene
        type: Number,
        min: 1
    },
    stock: {
        type: Number,
        default: 0,
        min: 0
    }
}, { _id: false });

const productSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    descripcion: {
        type: String,
        default: ''
    },
    sku: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // Precio base (actualmente Precio Pack)
    precio: {
        type: Number,
        required: [true, 'El precio base es obligatorio'],
        min: 0
    },
    unidadesPorPack: {
        type: Number,
        default: 1,
        min: 1
    },
    precioUnidad: {
        type: Number,
        min: 0,
        default: 0
    },
    precioPallet: {
        type: Number, // Precio por Pack en la compra por Pallet
        min: 0,
        default: 0
    },
    packsPorPallet: {
        type: Number,
        default: 1,
        min: 1
    },
    precioCard: {
        type: Number,
        min: 0
    },
    precioCosto: {
        type: Number,
        default: 0,
        min: 0,
        select: false // Por seguridad, no lo enviamos por defecto al cliente
    },
    stock: { // Stock en unidades totales? O en packs?
             // Usually stock is tracked in base units (bottles) or packs. 
             // Given the complexity, let's assume stock is just a number for now, user didn't specify unit of stock.
             // I'll keep it as is.
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    categoria: {
        type: String,
        required: true,
        index: true
    },
    imagenes: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    bulkPrices: [bulkPriceSchema],
    // Opciones de Venta Mayorista
    wholesale: {
        unit: {
            available: { type: Boolean, default: true },
            price: { type: Number } // Si no se especifica, usa el 'precio' base
        },
        pack: {
            available: { type: Boolean, default: false },
            price: { type: Number },
            unitsPerPack: { type: Number, default: 6 }
        },
        pallet: {
            available: { type: Boolean, default: false },
            price: { type: Number },
            unitsPerPallet: { type: Number, default: 0 },
            packsPerPallet: { type: Number, default: 0 }
        }
    },
    // Historial de Precios
    priceHistory: [{
        price: Number,
        costPrice: Number,
        date: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Validar y ordenar precios por mayor antes de guardar
productSchema.pre('save', function () {
    if (this.bulkPrices && this.bulkPrices.length > 1) {
        // Ordenar por minQuantity
        this.bulkPrices.sort((a, b) => a.minQuantity - b.minQuantity);

        // Validar que no haya cantidades duplicadas
        const quantities = this.bulkPrices.map(bp => bp.minQuantity);
        const hasDuplicates = quantities.some((q, index) => quantities.indexOf(q) !== index);

        if (hasDuplicates) {
            throw new Error('No se pueden repetir las cantidades mínimas en los precios por mayor');
        }
    }
});

// Índice para búsqueda de texto
productSchema.index({ nombre: 'text', descripcion: 'text', categoria: 'text' });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
