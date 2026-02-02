const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product.model');

const products = [
    {
        nombre: 'Coca Cola 2.25L',
        precio: 3117,
        categoria: 'GASEOSAS',
        stock: 500,
        sku: 'CC-225',
        imagenes: ['/products/cocacola_225l.png'],
        wholesale: {
            unit: { available: true, price: 3117 },
            pack: { available: true, price: 18700, unitsPerPack: 6 },
            pallet: { available: true, price: 249333, unitsPerPallet: 80 }
        }
    },
    {
        nombre: 'Coca Cola Zero 2.25L',
        precio: 3117,
        categoria: 'GASEOSAS',
        stock: 500,
        sku: 'CCZ-225',
        imagenes: ['/products/cocacola_zero_225l.png'],
        wholesale: {
            unit: { available: true, price: 3117 },
            pack: { available: true, price: 18700, unitsPerPack: 6 },
            pallet: { available: true, price: 249333, unitsPerPallet: 80 }
        }
    },
    {
        nombre: 'Sprite 2.25L',
        precio: 3117,
        categoria: 'GASEOSAS',
        stock: 500,
        sku: 'SP-225',
        imagenes: ['/products/sprite_225l.png'],
        wholesale: {
            unit: { available: true, price: 3117 },
            pack: { available: true, price: 18700, unitsPerPack: 6 },
            pallet: { available: true, price: 249333, unitsPerPallet: 80 }
        }
    },
    {
        nombre: 'Fanta 2.25L',
        precio: 3117,
        categoria: 'GASEOSAS',
        stock: 500,
        sku: 'FA-225',
        imagenes: ['/products/fanta_225l.png'],
        wholesale: {
            unit: { available: true, price: 3117 },
            pack: { available: true, price: 18700, unitsPerPack: 6 },
            pallet: { available: true, price: 249333, unitsPerPallet: 80 }
        }
    },
    {
        nombre: 'Coca Cola 1.5L',
        precio: 2405,
        categoria: 'GASEOSAS',
        stock: 500,
        sku: 'CC-150',
        imagenes: ['/products/cocacola_15l.png'],
        wholesale: {
            unit: { available: true, price: 2405 },
            pack: { available: true, price: 19240, unitsPerPack: 8 }
        }
    },
    {
        nombre: 'Coca Cola Zero 1.5L',
        precio: 2405,
        categoria: 'GASEOSAS',
        stock: 500,
        sku: 'CCZ-150',
        imagenes: ['/products/cocacola_15l.png'],
        wholesale: {
            unit: { available: true, price: 2405 },
            pack: { available: true, price: 19240, unitsPerPack: 8 }
        }
    },
    {
        nombre: 'Sprite 1.5L',
        precio: 2405,
        categoria: 'GASEOSAS',
        stock: 500,
        sku: 'SP-150',
        imagenes: ['/products/sprite_225l.png'],
        wholesale: {
            unit: { available: true, price: 2405 },
            pack: { available: true, price: 19240, unitsPerPack: 8 }
        }
    },
    {
        nombre: 'Fanta 1.5L',
        precio: 2405,
        categoria: 'GASEOSAS',
        stock: 500,
        sku: 'FA-150',
        imagenes: ['/products/fanta_225l.png'],
        wholesale: {
            unit: { available: true, price: 2405 },
            pack: { available: true, price: 19240, unitsPerPack: 8 }
        }
    },
    {
        nombre: 'Manaos Gaseosa 2.25L',
        precio: 1148,
        categoria: 'GASEOSAS',
        stock: 1000,
        sku: 'MN-225',
        imagenes: ['/products/manaos_225l.png'],
        wholesale: {
            unit: { available: true, price: 1148 },
            pack: { available: true, price: 6890, unitsPerPack: 6 }
        }
    },
    {
        nombre: 'Fernet Branca 750ml',
        precio: 11000,
        categoria: 'APERITIVOS',
        stock: 200,
        sku: 'FB-750',
        imagenes: ['/products/fernet_750ml.png'],
        wholesale: {
            unit: { available: true, price: 11000 },
            pack: { available: true, price: 132000, unitsPerPack: 12 }
        }
    },
    {
        nombre: 'Corona 710ml',
        precio: 2900,
        categoria: 'CERVEZAS',
        stock: 300,
        sku: 'COR-710',
        imagenes: ['/products/corona_710ml.png'],
        wholesale: {
            unit: { available: true, price: 2900 },
            pack: { available: true, price: 34800, unitsPerPack: 12 }
        }
    }
];

const seedProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB...');

        for (const pData of products) {
            const slug = pData.nombre.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

            // Check if product exists
            const exists = await Product.findOne({ nombre: pData.nombre });
            if (exists) {
                console.log(`Actualizando: ${pData.nombre}`);
                await Product.findByIdAndUpdate(exists._id, { ...pData, slug });
            } else {
                console.log(`Creando: ${pData.nombre}`);
                const newProduct = new Product({ ...pData, slug });
                await newProduct.save();
            }
        }

        console.log('Seed finalizado con éxito');
        process.exit(0);
    } catch (error) {
        console.error('Error en el seed:', error);
        process.exit(1);
    }
};

seedProducts();
