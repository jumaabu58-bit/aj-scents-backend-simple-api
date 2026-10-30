const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

// ======================
// PUT YOUR REAL TEST KEYS HERE
// ======================
const PESAPAL_CONSUMER_KEY = 'a8otG02MLwi9s7iNcNUpkWAbve0/nI1u';
const PESAPAL_CONSUMER_SECRET = '5qOPqottmFYukZ0Pc6QTCRBhsfI=';

const products = [
  { id: 1, name: "Noir Elegance", category: "woody", price: 185000, image: "https://images.pexels.com/photos/12562773/pexels-photo-12562773.jpeg", stock: 25 },
  { id: 2, name: "Rose Whisper", category: "floral", price: 165000, image: "https://images.pexels.com/photos/21067590/pexels-photo-21067590.jpeg", stock: 30 },
  { id: 3, name: "Ocean Breeze", category: "fresh", price: 145000, image: "https://images.pexels.com/photos/1666405/pexels-photo-1666405.jpeg", stock: 40 },
  { id: 4, name: "Golden Oud", category: "oriental", price: 245000, image: "https://images.pexels.com/photos/1961795/pexels-photo-1961795.jpeg", stock: 15 },
  { id: 5, name: "Vanilla Dream", category: "oriental", price: 155000, image: "https://images.pexels.com/photos/15096784/pexels-photo-15096784.jpeg", stock: 35 },
  { id: 6, name: "Citrus Bloom", category: "fresh", price: 135000, image: "https://images.pexels.com/photos/15190739/pexels-photo-15190739.jpeg", stock: 40 },
  { id: 7, name: "Jasmine Nights", category: "floral", price: 175000, image: "https://images.pexels.com/photos/21067590/pexels-photo-21067590.jpeg", stock: 28 },
  { id: 8, name: "Sandalwood Soul", category: "woody", price: 195000, image: "https://images.pexels.com/photos/12562773/pexels-photo-12562773.jpeg", stock: 22 }
];

let orders = [];

app.get('/', (req, res) => {
  res.json({ message: 'AJ Scents Backend is running!', status: 'OK' });
});

app.get('/api/products', (req, res) => {
  res.json({ success: true, count: products.length, data: products });
});

app.post('/api/orders', (req, res) => {
  try {
    const { name, phone, email, address, items } = req.body;

    if (!name || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide name, phone, address and items' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found` });
      }
      totalAmount += product.price * item.quantity;
      orderItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        price: product.price
      });
    }

    const order = {
      id: orders.length + 1,
      orderNumber: 'AJ-' + Date.now(),
      customer: { name, phone, email, address },
      items: orderItems,
      totalAmount,
      paymentStatus: 'pending',
      createdAt: new Date()
    };

    orders.push(order);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Temporary simple payment (we will improve Pesapal later)
app.post('/api/payments/initialize', (req, res) => {
  const { orderId } = req.body;
  const order = orders.find(o => o.id === Number(orderId));

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  // For now we return a success response so the website works
  res.json({
    success: true,
    message: 'Payment initialized',
    data: {
      paymentLink: 'https://jumaabu58-bit.github.io/aj-scents-frontend/',
      orderNumber: order.orderNumber
    }
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AJ Scents Backend running on port ${PORT}`);
});
