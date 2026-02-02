const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('../models/Product.model');

const imageMapping = {
    'Coca Cola 2.25L': '/products/cocacola_225l.png',
    'Coca Cola Zero 2.25L': '/products/cocacola_zero_225l.png',
    'Sprite 2.25L': '/products/sprite_225l.png',
    'Fanta 2.25L': '/products/fanta_225l.png',
    'Coca Cola 1.5L': '/products/cocacola_15l.png',
    'Coca Cola Zero 1.5L': '/products/cocacola_15l.png', // Reuse 1.5L image
    'Sprite 1.5L': '/products/sprite_225l.png', // Reuse 2.25L image (looks similar)
    'Fanta 1.5L': '/products/fanta_225l.png', // Reuse 2.25L image
    'Manaos Gaseosa 2.25L': '/products/manaos_225l.png',
    'Fernet Branca 750ml': '/products/fernet_750ml.png',
    'Corona 710ml': '/products/corona_710ml.png'
};

const updateProductImages = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB...');

        for (const [name, path] of Object.entries(imageMapping)) {
            const product = await Product.findOne({ nombre: name });
            if (product) {
                console.log(`Actualizando imagen para: ${name}`);
                await Product.findByIdAndUpdate(product._id, { imagenes: [path] });
            } else {
                console.log(`Producto no encontrado: ${name}`);
            }
        }

        console.log('Todas las imágenes actualizadas con éxito');
        process.exit(0);
    } catch (error) {
        console.error('Error actualizando imágenes:', error);
        process.exit(1);
    }
};

updateProductImages();
