const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // We will add this

const app = express();
app.use(cors());
app.use(express.json());

// ======================
// PESAPAL TEST CREDENTIALS
// Replace these with your real Test keys
// ======================
const PESAPAL_CONSUMER_KEY = 'a8otG02MLwi9s7iNcNUpkWAbve0/nI1u';
const PESAPAL_CONSUMER_SECRET = '5qOPqottmFYukZ0Pc6QTCRBhsfI=';
const PESAPAL_BASE_URL = 'https://cybqa.pesapal.com/pesapalv3/api'; // Sandbox

// Products
const products = [
  {
    id: 1,
    name: "Noir Elegance",
    category: "woody",
    price: 185000,
    description: "Deep and mysterious woody scent",
    image: "https://images.pexels.com/photos/12562773/pexels-photo-12562773.jpeg",
    stock: 25
  },
  {
    id: 2,
    name: "Rose Whisper",
    category: "floral",
    price: 165000,
    description: "Soft romantic rose fragrance",
    image: "https://images.pexels.com/photos/21067590/pexels-photo-21067590.jpeg",
    stock: 30
  },
  {
    id: 3,
    name: "Ocean Breeze",
    category: "fresh",
    price: 145000,
    description: "Fresh and clean aquatic scent",
    image: "https://images.pexels.com/photos/1666405/pexels-photo-1666405.jpeg",
    stock: 40
  },
  {
    id: 4,
    name: "Golden Oud",
    category: "oriental",
    price: 245000,
    description: "Rich and luxurious oud fragrance",
    image: "https://images.pexels.com/photos/1961795/pexels-photo-1961795.jpeg",
    stock: 15
  },
  {
    id: 5,
    name: "Vanilla Dream",
    category: "oriental",
    price: 155000,
    description: "Warm and sweet vanilla scent",
    image: "https://images.pexels.com/photos/15096784/pexels-photo-15096784.jpeg",
    stock: 35
  },
  {
    id: 6,
    name: "Citrus Bloom",
    category: "fresh",
    price: 135000,
    description: "Bright and energetic citrus notes",
    image: "https://images.pexels.com/photos/15190739/pexels-photo-15190739.jpeg",
    stock: 40
  },
  {
    id: 7,
    name: "Jasmine Nights",
    category: "floral",
    price: 175000,
    description: "Elegant night-blooming jasmine",
    image: "https://images.pexels.com/photos/21067590/pexels-photo-21067590.jpeg",
    stock: 28
  },
  {
    id: 8,
    name: "Sandalwood Soul",
    category: "woody",
    price: 195000,
    description: "Warm creamy sandalwood",
    image: "https://images.pexels.com/photos/12562773/pexels-photo-12562773.jpeg",
    stock: 22
  }
];

let orders = [];

// Home
app.get('/', (req, res) => {
  res.json({ 
    message: 'AJ Scents Backend with Pesapal is running!',
    status: 'OK'
  });
});

// Get all products
app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    count: products.length,
    data: products
  });
});

// Create Order
app.post('/api/orders', (req, res) => {
  try {
    const { name, phone, email, address, paymentMethod, items } = req.body;

    if (!name || !phone || !address || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone, address and items'
      });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${item.productId} not found`
        });
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
      paymentMethod: paymentMethod || 'pesapal',
      paymentStatus: 'pending',
      orderStatus: 'pending',
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

// ======================
// PESAPAL PAYMENT
// ======================
app.post('/api/payments/initialize', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = orders.find(o => o.id === Number(orderId));

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // 1. Get Pesapal Token
    const tokenRes = await fetch(`${PESAPAL_BASE_URL}/Auth/RequestToken`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        consumer_key: PESAPAL_CONSUMER_KEY,
        consumer_secret: PESAPAL_CONSUMER_SECRET
      })
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.token) {
      console.error('Token error:', tokenData);
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to get Pesapal token',
        error: tokenData
      });
    }

    const token = tokenData.token;

    // 2. Submit Order to Pesapal
    const orderPayload = {
      id: order.orderNumber,
      currency: 'UGX',
      amount: order.totalAmount,
      description: `AJ Scents Order ${order.orderNumber}`,
      callback_url: 'https://jumaabu58-bit.github.io/aj-scents-frontend/',
      notification_id: '', // We can add IPN later
      billing_address: {
        email_address: order.customer.email || 'customer@ajscents.com',
        phone_number: order.customer.phone,
        country_code: 'UG',
        first_name: order.customer.name.split(' ')[0] || 'Customer',
        last_name: order.customer.name.split(' ').slice(1).join(' ') || 'AJScents'
      }
    };

    const orderRes = await fetch(`${PESAPAL_BASE_URL}/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderPayload)
    });

    const orderData = await orderRes.json();

    if (orderData.redirect_url) {
      return res.json({
        success: true,
        message: 'Payment initialized',
        data: {
          paymentLink: orderData.redirect_url,
          orderNumber: order.orderNumber
        }
      });
    } else {
      console.error('Pesapal order error:', orderData);
      return res.status(400).json({
        success: false,
        message: 'Failed to create Pesapal payment',
        error: orderData
      });
    }

  } catch (error) {
    console.error('Payment Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AJ Scents Backend (Pesapal) running on port ${PORT}`);
});
