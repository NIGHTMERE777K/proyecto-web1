const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Almacenamiento temporal de usuarios (en producción usar una base de datos)
const users = [];
const carts = {};

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_seguro', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Rutas de autenticación
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Verificar si el usuario ya existe
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'Usuario ya existe' });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear nuevo usuario
    const user = {
      id: users.length + 1,
      email,
      password: hashedPassword
    };
    
    users.push(user);
    
    // Crear token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'tu_secreto_seguro');
    
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }
    
    // Crear token
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'tu_secreto_seguro');
    
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Rutas del carrito
app.get('/api/cart', authenticateToken, (req, res) => {
  const userCart = carts[req.user.id] || [];
  res.json(userCart);
});

app.post('/api/cart', authenticateToken, (req, res) => {
  const { productId, quantity, name, price } = req.body;
  
  if (!carts[req.user.id]) {
    carts[req.user.id] = [];
  }
  
  const existingItem = carts[req.user.id].find(item => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    carts[req.user.id].push({ productId, quantity, name, price });
  }
  
  res.json(carts[req.user.id]);
});

app.delete('/api/cart/:productId', authenticateToken, (req, res) => {
  const { productId } = req.params;
  
  if (carts[req.user.id]) {
    carts[req.user.id] = carts[req.user.id].filter(item => item.productId !== productId);
  }
  
  res.json(carts[req.user.id] || []);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
}); 