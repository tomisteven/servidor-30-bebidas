const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// Todas las rutas de reportes deben ser protegidas y solo admin
router.use(protect, authorize('admin'));

router.get('/stats', reportController.getGeneralStats);
router.get('/sales-history', reportController.getSalesOverTime);
router.get('/top-products', reportController.getTopProducts);

module.exports = router;
