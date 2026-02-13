const mongoose = require('mongoose');

// Cache para la conexión en entornos serverless
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI no está definida en las variables de entorno');
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState;
    console.log(`✅ MongoDB Conectado: ${db.connection.host}`);
  } catch (error) {
    console.error(`❌ Error en conexión MongoDB: ${error.message}`);
  }
};

module.exports = connectDB;
