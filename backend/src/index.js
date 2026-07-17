const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('./prisma');
const authMiddleware = require('./auth');
const authorize = require('./authorize');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs =require('fs');
const whatsappRoutes = require('./whatsapp/whatsapp.routes');


const app = express();
const uploadsDir = path.join(__dirname, 'uploads');
const logosDir = path.join(uploadsDir, 'logos');
const productsDir = path.join(uploadsDir, 'products');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

const uploadLogo = multer({
  dest: logosDir,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten imágenes PNG, JPG o WEBP'));
    }

    cb(null, true);
  },
});

const uploadProductImage = multer({
  dest: productsDir,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Solo se permiten imágenes PNG, JPG o WEBP'));
    }

    cb(null, true);
  },
});

app.use(cors());
app.use(express.json());
app.use('/api/whatsapp', whatsappRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



const JWT_SECRET = 'restaurante_secreto_123';

function getRestaurantScope(req) {
  if (req.user?.isSuperAdmin) {
    return {};
  }

  if (!req.user?.restaurantId) {
    const error = new Error('Usuario sin restaurantId');
    error.statusCode = 403;
    throw error;
  }

  return { restaurantId: req.user.restaurantId };
}

function getBranchScope(req) {
  if (req.user?.isSuperAdmin) {
    return {};
  }

  if (!req.user?.branchId) {
    const error = new Error('Usuario sin branchId');
    error.statusCode = 403;
    throw error;
  }

  return { branchId: req.user.branchId };
}


app.get('/', (req, res) => {
  res.json({
    message: 'Backend restaurante funcionando',
    endpoints: {
      login: 'POST /auth/login',
      branches: 'GET /branches',
      createBranch: 'POST /branches',
      roles: 'GET /roles',
      createRole: 'POST /roles',
      users: 'GET /users',
      createUser: 'POST /users',
      categories: 'GET /categories',
      createCategory: 'POST /categories',
      products: 'GET /products',
      createProduct: 'POST /products',
      tables: 'GET /tables',
      createTable: 'POST /tables',
      updateTableStatus: 'PATCH /tables/:id/status',
      orders: 'GET /orders',
      createOrder: 'POST /orders',
      orderDetail: 'GET /orders/:id',
      addOrderItem: 'POST /orders/:id/items',
      payments: 'GET /payments',
      createPayment: 'POST /payments',
      payOrder: 'PATCH /orders/:id/pay',
    },
  });
});

/* AUTH */
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'email y password son obligatorios',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        branch: true,
        role: true,
        restaurant: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Usuario inactivo',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
      });
    }

    if (!user.isSuperAdmin) {
      if (!user.restaurantId || !user.restaurant) {
        return res.status(403).json({
          error: 'El usuario no está asociado a ningún restaurante',
        });
      }

      if (user.restaurant.status !== 'ACTIVE') {
        return res.status(403).json({
          error: 'La cuenta del restaurante está suspendida o inactiva',
        });
      }

      if (user.restaurant.expiresAt && new Date(user.restaurant.expiresAt) < new Date()) {
        return res.status(403).json({
          error: 'La suscripción del restaurante ha vencido',
        });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role.name,
        branchId: user.branchId,
        restaurantId: user.restaurantId || null,
        isSuperAdmin: user.isSuperAdmin || false,
      },
      JWT_SECRET,
      { expiresIn: '9h' }
    );

    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login correcto',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'email y password son obligatorios',
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        branch: true,
        role: true,
        restaurant: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Usuario inactivo',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
      });
    }

    if (!user.isSuperAdmin) {
      if (!user.restaurantId || !user.restaurant) {
        return res.status(403).json({
          error: 'El usuario no está asociado a ningún restaurante',
        });
      }

      if (user.restaurant.status !== 'ACTIVE') {
        return res.status(403).json({
          error: 'La cuenta del restaurante está suspendida o inactiva',
        });
      }

      if (user.restaurant.expiresAt && new Date(user.restaurant.expiresAt) < new Date()) {
        return res.status(403).json({
          error: 'La suscripción del restaurante ha vencido',
        });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role.name,
        branchId: user.branchId,
        restaurantId: user.restaurantId || null,
        isSuperAdmin: user.isSuperAdmin || false,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      message: 'Login correcto',
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});


/* BRANCHES */
app.get('/branches', authMiddleware, async (req, res) => {
  try {
    const where = getRestaurantScope(req);

    const branches = await prisma.branch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(branches);
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ error: 'Error al obtener sucursales' });
  }
});

app.post('/branches', authMiddleware, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, code, address, phone } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'name y code son obligatorios' });
    }

    const branch = await prisma.branch.create({
      data: { name, code, address, phone },
    });

    res.status(201).json(branch);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe una sucursal con ese código' });
    }
    res.status(500).json({ error: 'Error al crear sucursal' });
  }
});



/*300 al 384 es para modiciar la configuracion del neocio */

app.get(
  '/settings/business/:branchId',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  async (req, res) => {
    try {
      const { branchId } = req.params;

      await ensureBranchBelongsToUser(branchId, req);

      const setting = await prisma.businessSetting.findUnique({
        where: { branchId },
      });

      res.json(setting || null);
    } catch (error) {
      console.error(error);
      res.status(error.statusCode || 500).json({
        error: error.message || 'Error al obtener configuración del negocio',
      });
    }
  }
);

app.post(
  '/settings/business/upload-logo',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  uploadLogo.single('logo'),
  async (req, res) => {
    try {
      if (!req.file) {
  return res.status(400).json({ error: 'No se recibió ningún archivo' });
}

const baseUrl = `${req.protocol}://${req.get('host')}`;
const fileUrl = `${baseUrl}/uploads/logos/${req.file.filename}`;

res.json({
  message: 'Logo subido correctamente',
  fileUrl,
});
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al subir logo' });
    }
  }
);

app.post(
  '/settings/business',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  async (req, res) => {
    try {
      const { branchId, businessName, ruc, address, phone, logoUrl } = req.body;

      if (!branchId || !businessName) {
        return res.status(400).json({
          error: 'branchId y businessName son obligatorios',
        });
      }

      const setting = await prisma.businessSetting.upsert({
        where: { branchId },
        update: {
          businessName,
          ruc: ruc || null,
          address: address || null,
          phone: phone || null,
          logoUrl: logoUrl || null,
        },
        create: {
          branchId,
          businessName,
          ruc: ruc || null,
          address: address || null,
          phone: phone || null,
          logoUrl: logoUrl || null,
        },
      });

      res.json(setting);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al guardar configuración del negocio' });
    }
  }
);




/* ROLES */
app.get('/roles', authMiddleware, authorize('ADMIN'), async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { createdAt: 'asc' },
    });
    res.json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
});

app.post('/roles', authMiddleware, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name es obligatorio' });
    }

    const role = await prisma.role.create({
      data: {
        name,
        description: description || null,
      },
    });

    res.status(201).json(role);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
    }
    res.status(500).json({ error: 'Error al crear rol' });
  }
});

/* USERS */
app.get('/users', authMiddleware, authorize('ADMIN'), async (req, res) => {
  try {
    const where = getRestaurantScope(req);

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: true,
        role: true,
      },
    });

    const usersWithoutPassword = users.map(({ passwordHash, ...user }) => user);
    res.json(usersWithoutPassword);
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({ error: 'Error al obtener usuarios' });
  }
});

app.post('/users', authMiddleware, authorize('ADMIN'), async (req, res) => {
  try {
    const {
      branchId,
      roleId,
      firstName,
      lastName,
      documentNumber,
      phone,
      email,
      password,
      avatarUrl,
    } = req.body;

    if (!branchId || !roleId || !firstName || !password) {
      return res.status(400).json({
        error: 'branchId, roleId, firstName y password son obligatorios',
      });
    }

    if (!req.user?.restaurantId) {
      return res.status(403).json({
        error: 'No se pudo identificar el restaurante del usuario actual',
      });
    }

    const branch = await prisma.branch.findFirst({
      where: {
        id: branchId,
        restaurantId: req.user.restaurantId,
      },
    });

    if (!branch) {
      return res.status(403).json({
        error: 'La sucursal no pertenece a tu restaurante',
      });
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return res.status(404).json({
        error: 'Rol no encontrado',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        branchId,
        restaurantId: req.user.restaurantId,
        roleId,
        firstName,
        lastName: lastName || '',
        documentNumber: documentNumber || null,
        phone: phone || null,
        email: email || null,
        passwordHash,
        avatarUrl: avatarUrl || null,
        isActive: true,
        isSuperAdmin: false,
      },
      include: {
        branch: true,
        role: true,
        restaurant: true,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        error: 'Ya existe un usuario con ese correo',
      });
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

/* CATEGORIES */
app.get('/categories', authMiddleware, async (req, res) => {
  try {
    const where = req.user?.isSuperAdmin
      ? {}
      : {
          branch: {
            restaurantId: req.user.restaurantId,
          },
        };

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: { branch: true },
    });

    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

app.post(
  '/categories',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  async (req, res) => {
    try {
      const { branchId, name, sortOrder } = req.body;

      if (!branchId || !name) {
        return res.status(400).json({ error: 'branchId y name son obligatorios' });
      }

      const category = await prisma.category.create({
        data: {
          branchId,
          name,
          sortOrder: sortOrder ?? 0,
        },
      });

      res.status(201).json(category);
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002') {
        return res
          .status(400)
          .json({ error: 'Ya existe una categoría con ese nombre en la sucursal' });
      }
      res.status(500).json({ error: 'Error al crear categoría' });
    }
  }
);



app.post(
  '/products/upload-image',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  uploadProductImage.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ninguna imagen' });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const fileUrl = `${baseUrl}/uploads/products/${req.file.filename}`;

      res.json({
        message: 'Imagen subida correctamente',
        fileUrl,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al subir imagen del producto' });
    }
  }
);

/* PRODUCTS */
app.get('/products', authMiddleware, async (req, res) => {
  try {
    const where = req.user?.isSuperAdmin
      ? {}
      : {
          branch: {
            restaurantId: req.user.restaurantId,
          },
        };

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        branch: true,
      },
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

app.post(
  '/products',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  async (req, res) => {
    try {
      const {
  branchId,
  categoryId,
  sku,
  name,
  description,
  price,
  taxRate,
  costReference,
  preparationTimeMinutes,
  imageUrl,
} = req.body;

      if (!branchId || !name || price === undefined) {
        return res.status(400).json({ error: 'branchId, name y price son obligatorios' });
      }

      await ensureBranchBelongsToUser(branchId, req);
      await ensureCategoryBelongsToUser(categoryId, req);

      const product = await prisma.product.create({
        data: {
          branchId,
          categoryId: categoryId || null,
          sku: sku || null,
          name,
          description: description || null,
          price: Number(price),
          taxRate: taxRate !== undefined ? Number(taxRate) : 0.18,
          costReference: costReference !== undefined ? Number(costReference) : null,
          preparationTimeMinutes:
            preparationTimeMinutes !== undefined ? Number(preparationTimeMinutes) : null,
            imageUrl: imageUrl || null,
        },
        include: {
          category: true,
          branch: true,
        },
      });

      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002') {
        return res
          .status(400)
          .json({ error: 'Ya existe un producto con ese SKU en la sucursal' });
      }
      res.status(error.statusCode || 500).json({ error: error.message || 'Error al crear producto' });
    }
  }

);app.patch(
  '/products/:id',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
  categoryId,
  sku,
  name,
  description,
  price,
  taxRate,
  costReference,
  preparationTimeMinutes,
  availableForSale,
  imageUrl,
} = req.body;

      const product = await prisma.product.update({
        where: { id },
        data: {
          categoryId: categoryId || null,
          sku: sku || null,
          name: name || undefined,
          description: description || null,
          price: price !== undefined ? Number(price) : undefined,
          taxRate: taxRate !== undefined ? Number(taxRate) : undefined,
          costReference:
            costReference !== undefined && costReference !== null
              ? Number(costReference)
              : costReference === null
              ? null
              : undefined,
          preparationTimeMinutes:
            preparationTimeMinutes !== undefined && preparationTimeMinutes !== null
              ? Number(preparationTimeMinutes)
              : preparationTimeMinutes === null
              ? null
              : undefined,
          availableForSale:
  availableForSale !== undefined ? Boolean(availableForSale) : undefined,
imageUrl: imageUrl !== undefined ? imageUrl || null : undefined,
        },
        include: {
          category: true,
          branch: true,
        },
      });

      res.json(product);
    } catch (error) {
      console.error(error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      if (error.code === 'P2002') {
        return res
          .status(400)
          .json({ error: 'Ya existe un producto con ese SKU en la sucursal' });
      }
      res.status(500).json({ error: 'Error al actualizar producto' });
    }
  }
);

app.delete(
  '/products/:id',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.product.delete({
        where: { id },
      });

      res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
      console.error(error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.status(500).json({ error: 'Error al eliminar producto' });
    }
  }
);

/* COCINERO */

/* COCINERO */

app.get('/kitchen/orders', authMiddleware, async (req, res) => {
  try {
    console.log('USUARIO COCINA:', req.user);

    const where = req.user?.isSuperAdmin
      ? {}
      : {
          branch: {
            restaurantId: req.user.restaurantId,
          },
        };

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        customer: true,
        branch: true,
        items: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const normalized = orders
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        createdAt: order.createdAt,
        tableName: order.table ? `Mesa ${order.table.number}` : null,
        customerName: order.customer?.fullName || null,
        items: (order.items || [])
          .filter((item) =>
            ['PENDING', 'PREPARING', 'READY'].includes(item.kitchenStatus)
          )
          .map((item) => ({
            id: item.id,
            productName: item.productNameSnapshot,
            qty: item.qty,
            notes: item.notes,
            kitchenStatus: item.kitchenStatus,
          })),
      }))
      .filter((order) => order.items.length > 0);

    console.log('PEDIDOS COCINA NORMALIZED:', JSON.stringify(normalized, null, 2));

    res.json(normalized);
  } catch (error) {
    console.error('Error obteniendo pedidos de cocina:', error);
    res.status(500).json({ error: 'No se pudo cargar cocina.' });
  }
});

/* ESTADO DE PREPARACION */

app.patch('/kitchen/items/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { kitchenStatus } = req.body;

    console.log('PATCH COCINA ITEM:', { id, kitchenStatus, user: req.user });

    const allowedStatuses = ['PENDING', 'PREPARING', 'READY'];

    if (!allowedStatuses.includes(kitchenStatus)) {
      return res.status(400).json({ error: 'Estado de cocina inválido.' });
    }

    const existingItem = await prisma.orderItem.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            branch: true,
          },
        },
      },
    });

    if (!existingItem) {
      return res.status(404).json({ error: 'Item no encontrado.' });
    }

    if (
      !req.user?.isSuperAdmin &&
      existingItem.order?.branch?.restaurantId !== req.user.restaurantId
    ) {
      return res.status(403).json({
        error: 'No tienes permiso para modificar items de otro restaurante.',
      });
    }

    const updatedItem = await prisma.orderItem.update({
      where: { id },
      data: { kitchenStatus },
    });

    return res.json(updatedItem);
  } catch (error) {
    console.error('Error actualizando estado de cocina:', error);
    return res.status(500).json({ error: 'No se pudo actualizar el estado.' });
  }
});




/* TABLES */
app.get('/tables', authMiddleware, async (req, res) => {
  try {
    const where = req.user?.isSuperAdmin
      ? {}
      : {
          branch: {
            restaurantId: req.user.restaurantId,
          },
        };

    const tables = await prisma.table.findMany({
      where,
      orderBy: { number: 'asc' },
      include: {
        branch: true,
        diningArea: true,
      },
    });

    res.json(tables);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener mesas' });
  }
});

app.post(
  '/tables',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'MOZO'),
  async (req, res) => {
    try {
      const { branchId, diningAreaId, number, name, capacity, status, posX, posY } = req.body;

      if (!branchId || number === undefined || !capacity) {
        return res
          .status(400)
          .json({ error: 'branchId, number y capacity son obligatorios' });
      }

      await ensureBranchBelongsToUser(branchId, req);

      const table = await prisma.table.create({
        data: {
          branchId,
          diningAreaId: diningAreaId || null,
          number: Number(number),
          name: name || null,
          capacity: Number(capacity),
          status: status || 'FREE',
          posX: posX !== undefined ? Number(posX) : null,
          posY: posY !== undefined ? Number(posY) : null,
        },
        include: {
          branch: true,
          diningArea: true,
        },
      });

      res.status(201).json(table);
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002') {
        return res
          .status(400)
          .json({ error: 'Ya existe una mesa con ese número en la sucursal' });
      }
      res.status(error.statusCode || 500).json({ error: error.message || 'Error al crear mesa' });
    }
  }
);

app.patch(
  '/tables/:id/status',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'MOZO'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = ['FREE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'DISABLED'];

      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }

      const table = await prisma.table.update({
        where: { id },
        data: { status },
      });

      res.json(table);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar estado de mesa' });
    }
  }
);
/* ELIMINAR MESAS NO OLVIDAAR */
app.delete(
  '/tables/:id',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const table = await prisma.table.findUnique({
        where: { id },
      });

      if (!table) {
        return res.status(404).json({ error: 'Mesa no encontrada' });
      }

      if (table.status === 'OCCUPIED') {
        return res.status(400).json({
          error: 'No se puede eliminar una mesa ocupada',
        });
      }

      await prisma.table.delete({
        where: { id },
      });

      res.json({ message: 'Mesa eliminada correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar mesa' });
    }
  }
);

/* ORDERS */
app.get('/orders', authMiddleware, async (req, res) => {
  try {
    const where = req.user?.isSuperAdmin
      ? {}
      : {
          branch: {
            restaurantId: req.user.restaurantId,
          },
        };

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: true,
        table: true,
        customer: true,
        items: true,
        payments: true,
      },
    });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

app.get('/orders/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: req.user?.isSuperAdmin
        ? { id }
        : {
            id,
            branch: {
              restaurantId: req.user.restaurantId,
            },
          },
      include: {
        branch: true,
        table: true,
        customer: true,
        items: {
          include: {
            product: true,
            modifiers: true,
          },
        },
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener detalle del pedido' });
  }
});

app.post(
  '/orders',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'MOZO'),
  async (req, res) => {
    try {
      const {
        branchId,
        tableId,
        customerId,
        waiterId,
        cashierId,
        orderType,
        channel,
        guestsCount,
        notes,
      } = req.body;

      if (!branchId || !orderType || !channel) {
        return res
          .status(400)
          .json({ error: 'branchId, orderType y channel son obligatorios' });
      }

      await ensureBranchBelongsToUser(branchId, req);
      await ensureTableBelongsToUser(tableId, req);

      const count = await prisma.order.count({ where: { branchId } });
      const orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`;

      const order = await prisma.order.create({
        data: {
          branchId,
          tableId: tableId || null,
          customerId: customerId || null,
          waiterId: waiterId || null,
          cashierId: cashierId || null,
          orderNumber,
          orderType,
          channel,
          guestsCount: guestsCount !== undefined ? Number(guestsCount) : null,
          notes: notes || null,
          status: 'CONFIRMED',
          subtotal: 0,
          tax: 0,
          discountTotal: 0,
          serviceCharge: 0,
          total: 0,
          openedAt: new Date(),
        },
        include: {
          branch: true,
          table: true,
          customer: true,
          items: true,
        },
      });

      if (tableId) {
        await prisma.table.update({
          where: { id: tableId },
          data: { status: 'OCCUPIED' },
        });
      }

      res.status(201).json(order);
    } catch (error) {
      console.error(error);
      res.status(error.statusCode || 500).json({ error: error.message || 'Error al crear pedido' });
    }
  }
);

app.post(
  '/orders/:id/items',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'MOZO'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { productId, qty, notes, discountAmount } = req.body;

      if (!productId || qty === undefined) {
        return res.status(400).json({ error: 'productId y qty son obligatorios' });
      }

      await ensureOrderBelongsToUser(id, req);
      await ensureProductBelongsToUser(productId, req);

      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }

      




      const quantity = Number(qty);
      const unitPrice = Number(product.price);
      const taxRate = Number(product.taxRate);
      const itemDiscount = discountAmount !== undefined ? Number(discountAmount) : 0;

      const subtotal = quantity * unitPrice;
      const total = subtotal - itemDiscount;

      const orderItem = await prisma.orderItem.create({
        data: {
          orderId: id,
          productId: product.id,
          productNameSnapshot: product.name,
          qty: quantity,
          unitPrice,
          taxRate,
          discountAmount: itemDiscount,
          subtotal,
          total,
          notes: notes || null,
          kitchenStatus: 'PENDING',
        },
        include: {
          product: true,
        },
      });

      const allItems = await prisma.orderItem.findMany({
        where: { orderId: id },
      });

      const newSubtotal = allItems.reduce((acc, item) => acc + Number(item.subtotal), 0);
      const newTax = allItems.reduce(
        (acc, item) =>
          acc + (Number(item.subtotal) - Number(item.discountAmount)) * Number(item.taxRate),
        0
      );
      const newDiscountTotal = allItems.reduce(
        (acc, item) => acc + Number(item.discountAmount),
        0
      );
      const newTotal = newSubtotal - newDiscountTotal + newTax;

      await prisma.order.update({
        where: { id },
        data: {
          subtotal: newSubtotal,
          tax: newTax,
          discountTotal: newDiscountTotal,
          total: newTotal,
          status: 'CONFIRMED',
        },
      });

      res.status(201).json(orderItem);
    } catch (error) {
      console.error(error);
      res.status(error.statusCode || 500).json({ error: error.message || 'Error al agregar item al pedido' });
    }
  }
);

app.patch(
  '/order-items/:id',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'MOZO'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { qty, notes, discountAmount } = req.body;

      const existingItem = await prisma.orderItem.findUnique({
        where: { id },
      });

      if (!existingItem) {
        return res.status(404).json({ error: 'Item del pedido no encontrado' });
      }

      const quantity = qty !== undefined ? Number(qty) : Number(existingItem.qty);

      if (quantity <= 0) {
        return res.status(400).json({ error: 'La cantidad debe ser mayor a cero' });
      }

      const itemDiscount =
        discountAmount !== undefined
          ? Number(discountAmount)
          : Number(existingItem.discountAmount);

      const subtotal = quantity * Number(existingItem.unitPrice);
      const total = subtotal - itemDiscount;

      const updatedItem = await prisma.orderItem.update({
        where: { id },
        data: {
          qty: quantity,
          notes: notes !== undefined ? notes || null : existingItem.notes,
          discountAmount: itemDiscount,
          subtotal,
          total,
        },
      });

      await recalculateOrderTotals(existingItem.orderId);

      res.json(updatedItem);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar item del pedido' });
    }
  }
);

app.delete(
  '/order-items/:id',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'MOZO'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const existingItem = await prisma.orderItem.findUnique({
        where: { id },
      });

      if (!existingItem) {
        return res.status(404).json({ error: 'Item del pedido no encontrado' });
      }

      await prisma.orderItem.delete({
        where: { id },
      });

     await recalculateOrderTotals(existingItem.orderId);

      res.json({ message: 'Item eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar item del pedido' });
    }
  }
);

function normalizeOrderStatus(order) {
  const hasPayments = (order.payments || []).length > 0;
  const hasItems = (order.items || []).length > 0;

  if (hasPayments) return 'PAID';
  if (hasItems) return 'CONFIRMED';
  return 'DRAFT';
}

async function recalculateOrderTotals(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
    },
  });

  if (!order) return null;

  const subtotal = (order.items || []).reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
  const discountTotal = (order.items || []).reduce(
    (acc, item) => acc + Number(item.discountAmount || 0),
    0
  );
  const tax = (order.items || []).reduce(
    (acc, item) => acc + (Number(item.total || 0) * Number(item.taxRate || 0)),
    0
  );
  const total = subtotal - discountTotal + tax;

  return prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal,
      discountTotal,
      tax,
      total,
      status: normalizeOrderStatus(order),
    },
    include: {
      items: true,
      payments: true,
      table: true,
      customer: true,
    },
  });
}



/* PAYMENTS */
app.get('/payments', authMiddleware, authorize('ADMIN', 'CAJA'), async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { paidAt: 'desc' },
      include: {
        order: true,
        customer: true,
        branch: true,
      },
    });

    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
});

app.post('/payments', authMiddleware, authorize('ADMIN', 'CAJA'), async (req, res) => {
  try {
    const { branchId, orderId, customerId, method, amount, referenceCode, createdById } =
      req.body;

    if (!branchId || !orderId || !method || amount === undefined || !createdById) {
      return res.status(400).json({
        error: 'branchId, orderId, method, amount y createdById son obligatorios',
      });
    }

    const payment = await prisma.payment.create({
      data: {
        branchId,
        orderId,
        customerId: customerId || null,
        method,
        amount: Number(amount),
        referenceCode: referenceCode || null,
        createdById,
      },
      include: {
        order: true,
        customer: true,
        branch: true,
      },
    });

    res.status(201).json(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear pago' });
  }
});

app.patch(
  '/orders/:id/pay',
  authMiddleware,
  authorize('ADMIN', 'CAJA', 'SUPERVISOR'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { method, amount, createdById, customerId = null } = req.body;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
          payments: true,
          table: true,
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Monto inválido' });
      }

      const payment = await prisma.payment.create({
        data: {
          orderId: id,
          customerId: customerId || order.customerId || null,
          method,
          amount: Number(amount),
          createdById,
          branchId: order.branchId,
        },
      });

      await prisma.order.update({
        where: { id },
        data: {
          status: 'PAID',
          customerId: customerId || order.customerId || null,
        },
      });

      if (order.tableId) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'FREE' },
        });
      }

      const updatedOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
          payments: true,
          table: true,
          customer: true,
        },
      });

      res.json({
        message: 'Pedido cobrado correctamente',
        payment,
        order: updatedOrder,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al cobrar pedido' });
    }
  }
);

app.patch(
  '/payments/:id',
  authMiddleware,
  authorize('ADMIN', 'CAJA', 'SUPERVISOR'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { method, amount } = req.body;

      const payment = await prisma.payment.findUnique({
        where: { id },
      });

      if (!payment) {
        return res.status(404).json({ error: 'Pago no encontrado' });
      }

      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          method: method || undefined,
          amount: amount !== undefined ? Number(amount) : undefined,
        },
      });

      await recalculateOrderTotals(payment.orderId);

      res.json({
        message: 'Pago actualizado correctamente',
        payment: updatedPayment,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar pago' });
    }
  }
);

app.delete(
  '/payments/:id',
  authMiddleware,
  authorize('ADMIN', 'CAJA', 'SUPERVISOR'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id },
      });

      if (!payment) {
        return res.status(404).json({ error: 'Pago no encontrado' });
      }

      await prisma.payment.delete({
        where: { id },
      });

      const order = await prisma.order.findUnique({
        where: { id: payment.orderId },
        include: {
          items: true,
          payments: true,
          table: true,
        },
      });

      if (order) {
        const newStatus = (order.items || []).length > 0 ? 'CONFIRMED' : 'DRAFT';

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: newStatus,
          },
        });

        if (order.tableId) {
          await prisma.table.update({
            where: { id: order.tableId },
            data: {
              status: 'OCCUPIED',
            },
          });
        }
      }

      res.json({ message: 'Pago eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar pago' });
    }
  }
);

app.delete(
  '/orders/:id',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'CAJA'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: true,
          payments: true,
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      await prisma.payment.deleteMany({
        where: { orderId: id },
      });

      await prisma.orderItem.deleteMany({
        where: { orderId: id },
      });

      await prisma.order.delete({
        where: { id },
      });

      if (order.tableId) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'FREE' },
        });
      }

      res.json({ message: 'Pedido eliminado correctamente' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar pedido' });
    }
  }
);

app.get(
  '/clients/lookup/dni/:dni',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'CAJA', 'MOZO'),
  async (req, res) => {
    try {
      const { dni } = req.params;

      if (!/^\d{8}$/.test(dni)) {
        return res.status(400).json({ error: 'El DNI debe tener 8 dígitos' });
      }

      // 1. Usar la nueva variable de entorno
      const token = process.env.APIPERU_TOKEN;

      if (!token) {
        return res.status(500).json({ error: 'APIPERU_TOKEN no configurado en el backend' });
      }

      // 2. Hacer la petición como POST según la documentación de apiperu.dev
      const response = await axios.post(
        'https://apiperu.dev/api/dni',
        { dni: dni }, // Se envía el DNI en el body
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const apiData = response.data;

      // 3. Validar la respuesta de la API
      if (!apiData?.success || !apiData?.data) {
        return res.status(404).json({ error: 'No se encontraron datos para ese DNI' });
      }

      const person = apiData.data;

      // 4. Retornar los datos mapeados a nuestro frontend
      return res.json({
        documentNumber: person.numero || dni,
        firstName: person.nombres || '',
        lastNamePaternal: person.apellido_paterno || '',
        lastNameMaternal: person.apellido_materno || '',
        fullName: person.nombre_completo || 
          [
            person.nombres || '',
            person.apellido_paterno || '',
            person.apellido_materno || '',
          ]
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim(),
      });
    } catch (error) {
      console.error(error?.response?.data || error.message);

      if (error?.response?.status === 401) {
        return res.status(401).json({ error: 'Token de APIPeru inválido o vencido' });
      }

      if (error?.response?.status === 404 || error?.response?.status === 422) {
        return res.status(404).json({ error: 'DNI no encontrado' });
      }

      return res.status(500).json({ error: 'Error consultando DNI en APIPeru' });
    }
  }
);

app.get(
  '/customers',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'CAJA', 'MOZO'),
  async (req, res) => {
    try {
      const customers = await prisma.customer.findMany({
        orderBy: { createdAt: 'desc' },
      });

      res.json(customers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al listar clientes' });
    }
  }
);

app.post(
  '/customers',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'CAJA', 'MOZO'),
  async (req, res) => {
    try {
      const {
        documentNumber,
        firstName,
        lastNamePaternal,
        lastNameMaternal,
      } = req.body;

      if (!documentNumber || !/^\d{8}$/.test(documentNumber)) {
        return res.status(400).json({ error: 'DNI inválido' });
      }

      if (!firstName || !lastNamePaternal || !lastNameMaternal) {
        return res.status(400).json({ error: 'Completa nombres y apellidos' });
      }

      const fullName = `${firstName} ${lastNamePaternal} ${lastNameMaternal}`
        .replace(/\s+/g, ' ')
        .trim();

      const existingCustomer = await prisma.customer.findFirst({
        where: { documentNumber },
      });

      if (existingCustomer) {
        return res.status(400).json({ error: 'Ya existe un cliente con ese DNI' });
      }

      const customer = await prisma.customer.create({
        data: {
          fullName,
          documentNumber,
        },
      });

      res.status(201).json(customer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al crear cliente' });
    }
  }
);

app.delete(
  '/customers/:id',
  authMiddleware,
  authorize('ADMIN', 'SUPERVISOR', 'CAJA'),
  async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.customer.delete({
        where: { id },
      });

      res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
      console.error(error);

      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }

      res.status(500).json({ error: 'Error al eliminar cliente' });
    }
  }
);

/* para el panel */
async function requireSuperAdmin(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        isSuperAdmin: true,
      },
    });

    if (!user || !user.isSuperAdmin) {
      return res.status(403).json({
        error: 'Acceso solo para super admin',
      });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: 'Error validando super admin',
    });
  }
}

app.get('/saas/stats', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const totalRecaudado = await prisma.subscription.aggregate({
      _sum: { amount: true },
      where: { status: 'ACTIVE' }
    });
    const totalRestaurantes = await prisma.restaurant.count();
    res.json({
      totalIngresos: totalRecaudado._sum.amount || 0,
      totalRestaurantes: totalRestaurantes
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener métricas del sistema' });
  }
});

app.get('/saas/restaurants', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        branches: {
          orderBy: { createdAt: 'asc' },
        },
        users: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json(restaurants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener restaurantes' });
  }
});

app.post('/saas/restaurants', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const {
      name,
      slug,
      subdomain,
      ruc,
      phone,
      address,
      logoUrl,
      planType,
      amount,
      startsAt,
      endsAt,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword,
      branchName,
      branchCode,
    } = req.body;

    if (!name || !slug || !subdomain || !adminFirstName || !adminLastName || !adminPassword) {
      return res.status(400).json({
        error: 'Faltan datos obligatorios para crear el restaurante',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name,
          slug,
          subdomain,
          ruc: ruc || null,
          phone: phone || null,
          address: address || null,
          logoUrl: logoUrl || null,
          planType: planType || 'TRIMESTRAL',
          status: 'ACTIVE',
          startsAt: startsAt ? new Date(startsAt) : new Date(),
          expiresAt: endsAt ? new Date(endsAt) : null,
        },
      });

      const branch = await tx.branch.create({
        data: {
          name: branchName || 'Sucursal Principal',
          code: branchCode || `${slug}-main`,
          address: address || null,
          phone: phone || null,
          restaurantId: restaurant.id,
        },
      });

      const adminRole = await tx.role.findFirst({
        where: {
          OR: [{ name: 'ADMIN' }, { name: 'Admin' }, { name: 'admin' }],
        },
      });

      if (!adminRole) {
        throw new Error('No existe el rol ADMIN en la base de datos');
      }

      const passwordHash = await bcrypt.hash(adminPassword, 10);

      const user = await tx.user.create({
        data: {
          firstName: adminFirstName,
          lastName: adminLastName,
          email: adminEmail || null,
          passwordHash,
          roleId: adminRole.id,
          branchId: branch.id,
          restaurantId: restaurant.id,
          isActive: true,
          isSuperAdmin: false,
        },
      });

      const subscription = await tx.subscription.create({
        data: {
          restaurantId: restaurant.id,
          planType: planType || 'TRIMESTRAL',
          amount: amount ? Number(amount) : 0,
          startsAt: startsAt ? new Date(startsAt) : new Date(),
          endsAt: endsAt ? new Date(endsAt) : null,
          status: 'ACTIVE',
        },
      });

      return {
        restaurant,
        branch,
        user,
        subscription,
      };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);

    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un restaurante, subdominio, sucursal o correo con esos datos' });
    }

    res.status(500).json({ error: error.message || 'Error al crear restaurante SaaS' });
  }
});

app.patch('/saas/restaurants/:id/reset-password', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        users: true,
      },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }

    let targetUser = null;

    if (userId) {
      targetUser = restaurant.users.find((u) => u.id === userId);
    }

    if (!targetUser) {
      targetUser = restaurant.users[0] || null;
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'No se encontró un usuario administrador para este restaurante' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { passwordHash },
    });

    res.json({
      message: 'Contraseña restablecida correctamente',
      userId: targetUser.id,
      email: targetUser.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
});

app.patch('/saas/restaurants/:id/reset-password', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: { users: true },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }

    let targetUser = null;

    if (userId) {
      targetUser = restaurant.users.find((u) => u.id === userId);
    }

    if (!targetUser) {
      targetUser = restaurant.users[0] || null;
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'No se encontró un usuario para este restaurante' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: targetUser.id },
      data: { passwordHash },
    });

    res.json({
      message: 'Contraseña restablecida correctamente',
      email: targetUser.email,
      userId: targetUser.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
});

// NUEVO ENDPOINT: Renovar/Reactivar Suscripción de Restaurante
app.patch('/saas/restaurants/:id/renew', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, amount } = req.body;

    if (!plan) {
      return res.status(400).json({ error: 'El plan es obligatorio para renovar' });
    }

    // 1. Verificar que el restaurante existe
    const restaurant = await prisma.restaurant.findUnique({
      where: { id }
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }

    // 2. Calcular las nuevas fechas
    // Si estaba vencido, empieza hoy. Si aún no vencía, se suma a la fecha actual.
    const startsAt = new Date();
    const endsAt = new Date(startsAt);

    if (plan === 'MENSUAL') {
      endsAt.setMonth(endsAt.getMonth() + 1);
    } else if (plan === 'TRIMESTRAL') {
      endsAt.setMonth(endsAt.getMonth() + 3);
    } else if (plan === 'ANUAL') {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    } else {
      return res.status(400).json({ error: 'Plan no válido (debe ser MENSUAL, TRIMESTRAL o ANUAL)' });
    }

    // 3. Ejecutar transacción para actualizar restaurante y crear historial de suscripción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar restaurante
      const updatedRestaurant = await tx.restaurant.update({
        where: { id },
        data: {
          planType: plan,
          status: 'ACTIVE',
          expiresAt: endsAt,
        },
      });

      // Crear registro de la nueva suscripción
      const newSubscription = await tx.subscription.create({
        data: {
          restaurantId: id,
          planType: plan,
          amount: amount ? Number(amount) : 0,
          startsAt: startsAt,
          endsAt: endsAt,
          status: 'ACTIVE',
        },
      });

      return { updatedRestaurant, newSubscription };
    });

    res.json({
      message: 'Suscripción reactivada correctamente',
      expiresAt: result.updatedRestaurant.expiresAt
    });

  } catch (error) {
    console.error('Error al renovar suscripción:', error);
    res.status(500).json({ error: 'Error interno al renovar suscripción' });
  }
});

app.delete('/saas/restaurants/:id', authMiddleware, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        branches: { select: { id: true } },
        users: { select: { id: true } },
        subscriptions: { select: { id: true } },
      },
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurante no encontrado' });
    }

    const branchIds = restaurant.branches.map((b) => b.id);

    await prisma.$transaction(async (tx) => {
      if (branchIds.length > 0) {
        // Configuración del negocio
        await tx.businessSetting.deleteMany({
          where: { branchId: { in: branchIds } },
        });

        // Pagos
        await tx.payment.deleteMany({
          where: { branchId: { in: branchIds } },
        });

        // Items de pedidos primero
        await tx.orderItem.deleteMany({
          where: {
            order: {
              branchId: { in: branchIds },
            },
          },
        });

        // Pedidos
        await tx.order.deleteMany({
          where: { branchId: { in: branchIds } },
        });

        // Productos
        await tx.product.deleteMany({
          where: { branchId: { in: branchIds } },
        });

        // Categorías
        await tx.category.deleteMany({
          where: { branchId: { in: branchIds } },
        });

        // Mesas
        await tx.table.deleteMany({
          where: { branchId: { in: branchIds } },
        });

        // Clientes de la sucursal si existen ligados por branch
        await tx.customer.deleteMany({
          where: { branchId: { in: branchIds } },
        });
      }

      // Suscripciones
      await tx.subscription.deleteMany({
        where: { restaurantId: id },
      });

      // Usuarios
      await tx.user.deleteMany({
        where: { restaurantId: id },
      });

      // Sucursales
      await tx.branch.deleteMany({
        where: { restaurantId: id },
      });

      // Restaurante
      await tx.restaurant.delete({
        where: { id },
      });
    });

    return res.json({ message: 'Restaurante eliminado correctamente' });
  } catch (error) {
    console.error('ERROR ELIMINANDO RESTAURANTE:', error);
    return res.status(500).json({
      error: error.message || 'Error al eliminar restaurante',
    });
  }
});


async function ensureBranchBelongsToUser(branchId, req) {
  if (req.user?.isSuperAdmin) return true;

  const branch = await prisma.branch.findFirst({
    where: {
      id: branchId,
      restaurantId: req.user.restaurantId,
    },
  });

  if (!branch) {
    const error = new Error('Sucursal no permitida para este restaurante');
    error.statusCode = 403;
    throw error;
  }

  return true;
}

async function ensureCategoryBelongsToUser(categoryId, req) {
  if (!categoryId) return true;
  if (req.user?.isSuperAdmin) return true;

  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      branch: {
        restaurantId: req.user.restaurantId,
      },
    },
  });

  if (!category) {
    const error = new Error('Categoría no permitida para este restaurante');
    error.statusCode = 403;
    throw error;
  }

  return true;
}

async function ensureTableBelongsToUser(tableId, req) {
  if (!tableId) return true;
  if (req.user?.isSuperAdmin) return true;

  const table = await prisma.table.findFirst({
    where: {
      id: tableId,
      branch: {
        restaurantId: req.user.restaurantId,
      },
    },
  });

  if (!table) {
    const error = new Error('Mesa no permitida para este restaurante');
    error.statusCode = 403;
    throw error;
  }

  return true;
}

async function ensureProductBelongsToUser(productId, req) {
  if (req.user?.isSuperAdmin) return true;

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      branch: {
        restaurantId: req.user.restaurantId,
      },
    },
  });

  if (!product) {
    const error = new Error('Producto no permitido para este restaurante');
    error.statusCode = 403;
    throw error;
  }

  return true;
}

async function ensureOrderBelongsToUser(orderId, req) {
  if (req.user?.isSuperAdmin) return true;

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      branch: {
        restaurantId: req.user.restaurantId,
      },
    },
  });

  if (!order) {
    const error = new Error('Pedido no permitido para este restaurante');
    error.statusCode = 403;
    throw error;
  }

  return true;
}

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});