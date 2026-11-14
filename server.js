const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// ======================
// STRIPE TEST KEYS
// ======================
const STRIPE_SECRET_KEY = 'sk_test_51Uav82GZEht3yltUxA0spEbIBjxiR1DeJpOLTyMTIT5EFyFD5vYZAePdGk0E01PUVppWoEc5dC0X85vTQOC0KaDc00LLSECP0u';
const FRONTEND_URL = 'https://jumaabu58-bit.github.io/aj-scents-frontend/';

// Optional: keep Pesapal (can ignore if unused)
const PESAPAL_CONSUMER_KEY = 'a8otG02MLwi9s7iNcNUpkWAbve0/nI1u';
const PESAPAL_CONSUMER_SECRET = '5qOPqottmFYukZ0Pc6QTCRBhsfI=';
const PESAPAL_BASE_URL = 'https://pay.pesapal.com/v3/api';
const IPN_URL = 'https://aj-scents-backend-simple-api.onrender.com/api/payments/ipn';

const products = [
  { id: 1, name: "Test Payment Item", category: "perfume", price: 1000, image: "https://images.pexels.com/photos/965989/pexels-photo-965989.jpeg" },
  { id: 2, name: "Rose Whisper", category: "perfume", price: 165000, image: "https://images.pexels.com/photos/965990/pexels-photo-965990.jpeg" },
  { id: 3, name: "Ocean Breeze", category: "perfume", price: 145000, image: "https://images.pexels.com/photos/258244/pexels-photo-258244.jpeg" },
  { id: 4, name: "Golden Oud", category: "perfume", price: 245000, image: "https://images.pexels.com/photos/1961795/pexels-photo-1961795.jpeg" },
  { id: 5, name: "Vanilla Dream", category: "perfume", price: 155000, image: "https://images.pexels.com/photos/15096784/pexels-photo-15096784.jpeg" },
  { id: 6, name: "Citrus Bloom", category: "perfume", price: 135000, image: "https://images.pexels.com/photos/15190739/pexels-photo-15190739.jpeg" },
  { id: 7, name: "Jasmine Nights", category: "perfume", price: 175000, image: "https://images.pexels.com/photos/3738339/pexels-photo-3738339.jpeg" },
  { id: 8, name: "Sandalwood Soul", category: "perfume", price: 195000, image: "https://images.pexels.com/photos/12562773/pexels-photo-12562773.jpeg" },
  { id: 9, name: "Premium Leather Shoe 1", category: "shoes", price: 280000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261031-WA0010.jpg" },
  { id: 10, name: "Premium Leather Shoe 2", category: "shoes", price: 295000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261031-WA0011.jpg" },
  { id: 11, name: "Premium Leather Shoe 3", category: "shoes", price: 310000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261031-WA0012.jpg" },
  { id: 12, name: "Premium Leather Shoe 4", category: "shoes", price: 275000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261031-WA0013.jpg" },
  { id: 13, name: "Classic Backpack", category: "bags", price: 185000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261029-WA0034.jpg" },
  { id: 14, name: "Designer Backpack", category: "bags", price: 210000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261029-WA0109.jpg" },
  { id: 15, name: "Urban Backpack", category: "bags", price: 195000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261029-WA0110.jpg" },
  { id: 16, name: "Leather Style Bag", category: "bags", price: 225000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261029-WA0112.jpg" },
  { id: 17, name: "Travel Backpack", category: "bags", price: 240000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261029-WA0113.jpg" },
  { id: 18, name: "Casual Backpack", category: "bags", price: 175000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261029-WA0115.jpg" },
  { id: 19, name: "Premium Backpack", category: "bags", price: 255000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261029-WA0116.jpg" },
  { id: 20, name: "Stylish Backpack", category: "bags", price: 190000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261029-WA0117.jpg" },
  { id: 21, name: "Modern Backpack", category: "bags", price: 205000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261029-WA0119.jpg" },
  { id: 22, name: "Executive Bag", category: "bags", price: 265000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261029-WA0121.jpg" },
  { id: 23, name: "City Backpack", category: "bags", price: 180000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261029-WA0122.jpg" },
  { id: 24, name: "Luxury Backpack", category: "bags", price: 275000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261029-WA0124.jpg" },
  { id: 25, name: "Everyday Backpack", category: "bags", price: 165000, image: "https://jumaabu58-bit.github.io/aj-scents-frontend/IMG-20261029-WA0125.jpg" }
];

let orders = [];

app.get('/', (req, res) => {
  res.json({ message: 'AJ Scents Backend with Stripe is running!', status: 'OK' });
});

app.get('/api/products', (req, res) => {
  res.json({ success: true, count: products.length, data: products });
});

app.post('/api/orders', (req, res) => {
  try {
    const { name, phone, email, address, items } = req.body;
    if (!name || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let totalAmount = 0;
    const orderItems = [];
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;
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

    res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// ======================
// STRIPE CHECKOUT
// ======================
app.post('/api/payments/stripe', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = orders.find(o => o.id === Number(orderId));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Stripe amounts are in the smallest currency unit.
    // For UGX, Stripe uses the amount as whole shillings (zero-decimal currency).
    const lineItems = order.items.map(item => {
      return (
        'line_items[' + order.items.indexOf(item) + '][price_data][currency]=ugx&' +
        'line_items[' + order.items.indexOf(item) + '][price_data][product_data][name]=' + encodeURIComponent(item.name) + '&' +
        'line_items[' + order.items.indexOf(item) + '][price_data][unit_amount]=' + item.price + '&' +
        'line_items[' + order.items.indexOf(item) + '][quantity]=' + item.quantity
      );
    }).join('&');

    const body =
      lineItems +
      '&mode=payment' +
      '&success_url=' + encodeURIComponent(FRONTEND_URL + '?payment=success&order=' + order.orderNumber) +
      '&cancel_url=' + encodeURIComponent(FRONTEND_URL + '?payment=cancelled') +
      '&customer_email=' + encodeURIComponent(order.customer.email || 'customer@ajscents.com') +
      '&metadata[orderNumber]=' + encodeURIComponent(order.orderNumber) +
      '&metadata[customerName]=' + encodeURIComponent(order.customer.name) +
      '&metadata[customerPhone]=' + encodeURIComponent(order.customer.phone);

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body
    });

    const session = await stripeRes.json();

    if (!session.url) {
      console.error('Stripe error:', session);
      return res.status(400).json({
        success: false,
        message: session.error ? session.error.message : 'Failed to create Stripe session',
        error: session
      });
    }

    res.json({
      success: true,
      message: 'Stripe checkout created',
      data: {
        paymentLink: session.url,
        sessionId: session.id,
        orderNumber: order.orderNumber
      }
    });
  } catch (error) {
    console.error('Stripe Payment Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('AJ Scents Backend (Stripe) running on port ' + PORT);
});
