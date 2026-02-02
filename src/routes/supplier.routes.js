const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

// All supplier routes should be protected and only for admins
router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .get(supplierController.getAllSuppliers)
    .post(supplierController.createSupplier);

router.route('/:id')
    .get(supplierController.getSupplierById)
    .put(supplierController.updateSupplier)
    .delete(supplierController.deleteSupplier);

module.exports = router;
