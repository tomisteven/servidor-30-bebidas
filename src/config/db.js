const mongoose = require('mongoose');

// Cache para la conexión en entornos serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI no está definida en las variables de entorno');
    process.exit(1);
  }

  try {
    // Configuramos Mongoose para que no use buffering si la conexión falla
    mongoose.set('bufferCommands', false);

    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Tiempo máximo para seleccionar servidor
    });

    isConnected = db.connections[0].readyState;
    console.log(`✅ MongoDB Conectado: ${db.connection.host}`);
  } catch (error) {
    console.error(`❌ Error en conexión MongoDB: ${error.message}`);
    // Lanzamos el error para que el middleware o el servidor lo capturen
    throw error;
  }
};

module.exports = connectDB;
