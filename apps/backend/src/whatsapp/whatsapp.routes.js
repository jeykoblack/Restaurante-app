const express = require('express');
const {
  testIncomingMessage,
  createDeliveryOrder,
  processOrderMessage,
} = require('./whatsapp.controller');

const router = express.Router();

router.post('/test-message', testIncomingMessage);
router.post('/create-delivery-order', createDeliveryOrder);
router.post('/process-order', processOrderMessage);

module.exports = router;