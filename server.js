const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ======================
// PRODUCTS (Hardcoded for simplicity)
// ======================
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

// Store orders in memory (temporary)
let orders = [];

// ======================
// ROUTES
// ======================

// Home
app.get('/', (req, res) => {
  res.json({ 
    message: 'AJ Scents Backend is running!',
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

// Get single product
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === Number(req.params.id));
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, data: product });
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
      paymentMethod: paymentMethod || 'flutterwave',
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

// Initialize Payment (Flutterwave)
app.post('/api/payments/initialize', async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = orders.find(o => o.id === Number(orderId));
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // For now we return a simulated payment link
    // Later we will connect real Flutterwave keys
    const paymentLink = `https://checkout.flutterwave.com/v3/hosted/pay/simulated-${order.orderNumber}`;

    res.json({
      success: true,
      message: 'Payment initialized',
      data: {
        paymentLink,
        orderNumber: order.orderNumber
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});


// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AJ Scents Backend running on port ${PORT}`);
});
