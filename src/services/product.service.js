const Product = require('../models/Product.model');
const Order = require('../models/Order.model');

class ProductService {
    async createProduct(productData) {
        // Generar slug si no existe
        if (!productData.slug) {
            productData.slug = productData.nombre.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }
        return await Product.create(productData);
    }

    async getAllProducts(query = {}) {
        const { search, categoria, sort, page = 1, limit = 12, isAdmin, excludeCategoria } = query;
        const filter = { isDeleted: false };

        const isAdminBoolean = isAdmin === 'true' || isAdmin === true;

        // Si no es admin, solo mostrar activos
        if (!isAdminBoolean) {
            filter.isActive = true;
        }



        if (search) {
            // Usar regex para búsqueda más flexible (parcial e insensible a mayúsculas)
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { nombre: { $regex: searchRegex } },
                { descripcion: { $regex: searchRegex } },
                { categoria: { $regex: searchRegex } }
            ];
        }

        if (categoria) {
            filter.categoria = categoria;
        }

        // Excluir categoría específica (ej: NICHO en Home) - case insensitive
        if (excludeCategoria && !categoria) {
            filter.categoria = { $not: { $regex: new RegExp(`^${excludeCategoria}$`, 'i') } };
        }

        // Filtrar productos por disponibilidad mayorista (opcional)
        // if (wholesaleType && ['unit', 'pack', 'pallet'].includes(wholesaleType)) {
        //     filter[`wholesale.${wholesaleType}.available`] = true;
        // }

        const sortOptions = {};
        if (sort) {
            const [field, order] = sort.split(':');
            sortOptions[field] = order === 'desc' ? -1 : 1;
        } else {
            sortOptions.createdAt = -1;
        }

        let queryBuilder = Product.find(filter).sort(sortOptions);

        if (isAdmin) {
            queryBuilder = queryBuilder.select('+precioCosto');
        }

        if (limit && parseInt(limit) !== 0) {
            queryBuilder = queryBuilder.limit(limit * 1).skip((page - 1) * limit);
        }

        const products = await queryBuilder.exec();

        const count = await Product.countDocuments(filter);

        return {
            products,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalResults: count
        };
    }

    async getCategories() {
        // Obtenemos categorías de productos que no estén eliminados y tengan categoría definida
        const categories = await Product.find({
            isDeleted: false,
            categoria: { $exists: true, $ne: '' }
        }).distinct('categoria');

        return categories.filter(c => c && typeof c === 'string' && c.trim() !== '');
    }

    async getProductBySlug(slug, isAdmin = false) {
        let query = Product.findOne({ slug, isDeleted: false });
        
        if (isAdmin) {
            query = query.select('+precioCosto');
        }

        const product = await query.exec();
        if (!product) throw new Error('Producto no encontrado');
        return product;
    }

    async updateProduct(id, updateData) {
        const product = await Product.findById(id).select('+precioCosto');
        if (!product) throw new Error('Producto no encontrado');

        // Actualizar campos permitidos
        const allowedFields = ['nombre', 'descripcion', 'sku', 'precio', 'unidadesPorPack', 'precioUnidad', 'precioPallet', 'packsPorPallet', 'precioCard', 'precioCosto', 'stock', 'categoria', 'imagenes', 'bulkPrices', 'isActive', 'wholesale'];
        // Detectar cambios de precio para historial
        if (updateData.precio !== undefined || updateData.precioCosto !== undefined) {
            const currentPrice = product.precio;
            const currentCost = product.precioCosto; // Este campo tiene select:false, cuidado si no se trajo
            
            // Si el precio o costo cambian, guardamos el historial
            // Nota: Para que product.precioCosto esté disponible, debemos asegurarnos de haberlo traído
            // o confiar en que si vamos a actualizar precioCosto, ya tenemos el nuevo valor.
            // Lo ideal es guardar el valor ANTERIOR en el historial.

            // Si el producto no tenía historial, lo inicializamos
            if (!product.priceHistory) product.priceHistory = [];

            // Solo guardamos si realmente hubo un cambio
            const newPrice = updateData.precio !== undefined ? Number(updateData.precio) : currentPrice;
            const newCost = updateData.precioCosto !== undefined ? Number(updateData.precioCosto) : (currentCost || 0);

            if (newPrice !== currentPrice || newCost !== currentCost) {
                product.priceHistory.push({
                    price: currentPrice,
                    costPrice: currentCost || 0,
                    date: new Date()
                });
            }
        }

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                product[field] = updateData[field];
            }
        });

        // Actualizar slug si cambió el nombre
        if (updateData.nombre && updateData.nombre !== product.nombre) {
            product.slug = updateData.nombre.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
        }

        return await product.save();
    }

    async deleteProduct(id) {
        // Soft delete
        const product = await Product.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!product) throw new Error('Producto no encontrado');
        return product;
    }

    async toggleStatus(id) {
        const product = await Product.findById(id);
        if (!product) throw new Error('Producto no encontrado');
        product.isActive = !product.isActive;
        return await product.save();
    }

    // Calcular precio aplicable según cantidad (lógica mayorista)
    calculateBulkPrice(product, quantity) {
        if (!product.bulkPrices || product.bulkPrices.length === 0) {
            return product.precio;
        }

        // Buscar el tramo más alto que se cumpla
        const applicablePrice = product.bulkPrices
            .filter(bp => quantity >= bp.minQuantity)
            .sort((a, b) => b.minQuantity - a.minQuantity)[0];

        return applicablePrice ? applicablePrice.price : product.precio;
    }

    async getHistoryStats(id) {
        const product = await Product.findById(id);
        if (!product) throw new Error('Producto no encontrado');

        // Construir períodos de tiempo basados en el historial
        // El historial guarda cuándo CAMBIÓ el precio, así que el período de ese precio
        // empieza en esa fecha y termina en la fecha del siguiente cambio (o hoy)
        // PERO: El historial guarda el precio ANTERIOR.
        // Ejemplo:
        // Creado el 1 Ene con Precio 100.
        // El 10 Ene cambiamos a 150. Historial: [{ price: 100, date: 10 Ene }]
        // El 20 Ene cambiamos a 200. Historial: [{ price: 100, date: 10 Ene }, { price: 150, date: 20 Ene }]
        // Períodos:
        // 1. Precio 100: Desde product.createdAt hasta 10 Ene.
        // 2. Precio 150: Desde 10 Ene hasta 20 Ene.
        // 3. Precio 200 (actual): Desde 20 Ene hasta Hoy.

        let periods = [];
        const history = product.priceHistory || [];
        
        // Ordenar historial por fecha ascendente
        const sortedHistory = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));

        // 1. Primer período (desde creación hasta primer cambio)
        // Si no hay historial, es desde creación hasta hoy con precio actual (o inicial si no se cambió nunca)
        let startDate = product.createdAt;
        
        for (let i = 0; i < sortedHistory.length; i++) {
            const entry = sortedHistory[i];
            const endDate = entry.date;
            
            periods.push({
                price: entry.price,
                costPrice: entry.costPrice,
                startDate: startDate,
                endDate: endDate
            });

            startDate = endDate;
        }

        // 2. Último período (desde último cambio hasta hoy, con precio ACTUAL)
        periods.push({
            price: product.precio,
            costPrice: product.precioCosto,
            startDate: startDate,
            endDate: new Date()
        });

        // Calcular ventas por período
        const stats = await Promise.all(periods.map(async (period) => {
            const sales = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(period.startDate), $lt: new Date(period.endDate) },
                        status: { $ne: 'cancelado' }, // Ignorar cancelados
                        'items.product': product._id
                    }
                },
                { $unwind: '$items' },
                {
                    $match: {
                        'items.product': product._id
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSold: { $sum: '$items.quantity' },
                        totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.precio'] } } // Precio al que se vendió real
                    }
                }
            ]);

            return {
                ...period,
                totalSold: sales.length > 0 ? sales[0].totalSold : 0,
                // revenue: sales.length > 0 ? sales[0].totalRevenue : 0 // Opcional
            };
        }));
        
        // Retornamos invertido para mostrar del más reciente al más antiguo
        return stats.reverse();
    }
}

module.exports = new ProductService();
