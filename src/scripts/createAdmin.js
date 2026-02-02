const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User.model');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Conectado...');

        const adminData = {
            nombre: 'Administrador 30 Bebidas',
            email: 'admin@30bebidas.com',
            password: 'admin123456', // Se recomienda cambiar después de loguear
            role: 'admin',
            plainPassword: 'admin123456'
        };

        const existingUser = await User.findOne({ email: adminData.email });
        if (existingUser) {
            console.log('El usuario administrador ya existe.');
            process.exit();
        }

        const admin = new User(adminData);
        await admin.save();

        console.log('-----------------------------------');
        console.log('Usuario Administrador Creado con Éxito');
        console.log(`Email: ${admin.email}`);
        console.log(`Password: ${adminData.password}`);
        console.log('-----------------------------------');

        process.exit();
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

createAdmin();
