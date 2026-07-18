const prisma = require('../prisma');
const { parseOrderMessage } = require('./whatsapp.parser');

const PRODUCT_NAME_MAP = {
  ceviche_conchas_negras: 'Ceviche de Conchas Negras',
  inka_kola_1l: 'GASEOSA INKA KOLA 1L',
  ceviche_clasico: 'Ceviche Clasico',
};

const normalizeText = (text = '') => {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const simulateWhatsappOrder = async ({ message, customerPhone }) => {
  const parsed = parseOrderMessage(message);

  return {
    customerPhone,
    parsed,
    reply: parsed.ok
      ? `Te entendí este pedido:\n${parsed.items
          .map((item) => `- ${item.qty} ${item.name}`)
          .join('\n')}\nTotal: S/ ${parsed.total.toFixed(2)}`
      : 'No pude identificar productos válidos en tu mensaje.',
  };
};

const resolveProductsForParsedItems = async ({ branchId, parsedItems }) => {
  const products = await prisma.product.findMany({
    where: { branchId },
  });

  if (!products.length) {
    throw new Error('No hay productos registrados en esta sucursal');
  }

  const productByNormalizedName = new Map(
    products.map((product) => [normalizeText(product.name), product])
  );

  const resolvedItems = parsedItems
    .map((item) => {
      const mappedName = PRODUCT_NAME_MAP[item.productKey] || item.name;
      const product =
        productByNormalizedName.get(normalizeText(mappedName)) ||
        productByNormalizedName.get(normalizeText(item.name));

      if (!product) return null;

      const qty = Number(item.qty || 1);
      const unitPrice = Number(product.price);
      const taxRate = Number(product.taxRate || 0);
      const subtotal = qty * unitPrice;
      const total = subtotal;

      return {
        productId: product.id,
        productNameSnapshot: product.name,
        qty,
        unitPrice,
        taxRate,
        discountAmount: 0,
        subtotal,
        total,
        notes: null,
        kitchenStatus: 'PENDING',
      };
    })
    .filter(Boolean);

  return resolvedItems;
};

const createDeliveryOrderFromWhatsapp = async ({
  branchId,
  customerName,
  customerPhone,
  deliveryAddress,
  reference,
  notes,
  parsedItems,
}) => {
  if (!branchId) throw new Error('branchId es obligatorio');
  if (!customerName) throw new Error('customerName es obligatorio');
  if (!customerPhone) throw new Error('customerPhone es obligatorio');
  if (!deliveryAddress) throw new Error('deliveryAddress es obligatorio');
  if (!Array.isArray(parsedItems) || !parsedItems.length) {
    throw new Error('parsedItems es obligatorio y debe tener productos');
  }

  const count = await prisma.order.count({
    where: { branchId },
  });

  const orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`;

  const validItems = await resolveProductsForParsedItems({
    branchId,
    parsedItems,
  });

  if (!validItems.length) {
    throw new Error('Ningún producto detectado coincide con productos reales del sistema');
  }

  const orderSubtotal = validItems.reduce((acc, item) => acc + Number(item.subtotal), 0);
  const orderTax = validItems.reduce(
    (acc, item) => acc + Number(item.subtotal) * Number(item.taxRate),
    0
  );
  const orderTotal = orderSubtotal + orderTax;

  const order = await prisma.order.create({
    data: {
      branchId,
      tableId: null,
      customerId: null,
      waiterId: null,
      cashierId: null,
      orderNumber,
      orderType: 'DELIVERY',
      channel: 'WHATSAPP',
      guestsCount: 1,
      notes: notes || reference || null,
      status: 'CONFIRMED',
      subtotal: orderSubtotal,
      tax: orderTax,
      discountTotal: 0,
      serviceCharge: 0,
      total: orderTotal,
      openedAt: new Date(),
      items: {
        create: validItems,
      },
    },
    include: {
      items: true,
      branch: true,
    },
  });

  return {
    ok: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
    customer: {
      name: customerName,
      phone: customerPhone,
      address: deliveryAddress,
      reference: reference || null,
    },
    items: order.items,
  };
};

const processWhatsappOrder = async ({
  branchId,
  customerName,
  customerPhone,
  deliveryAddress,
  reference,
  notes,
  message,
}) => {
  if (!message || !String(message).trim()) {
    throw new Error('message es obligatorio');
  }

  const parsed = parseOrderMessage(message);

  if (!parsed.ok || !parsed.items.length) {
    return {
      ok: false,
      parsed,
      reply:
        'No pude identificar productos válidos en tu mensaje. Intenta escribir el pedido con más detalle.',
    };
  }

  const createdOrder = await createDeliveryOrderFromWhatsapp({
    branchId,
    customerName,
    customerPhone,
    deliveryAddress,
    reference,
    notes,
    parsedItems: parsed.items,
  });

  return {
    ok: true,
    parsed,
    order: createdOrder,
    reply: `Tu pedido ${createdOrder.orderNumber} fue registrado correctamente. Total: S/ ${Number(
      createdOrder.total || 0
    ).toFixed(2)}. Tiempo estimado: 30 minutos.`,
  };
};

module.exports = {
  simulateWhatsappOrder,
  createDeliveryOrderFromWhatsapp,
  processWhatsappOrder,
};