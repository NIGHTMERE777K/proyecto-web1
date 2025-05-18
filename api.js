const API_URL = 'http://localhost:3000/api';

// Funciones de autenticación
export const register = async (email, password) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

// Funciones del carrito
export const getCart = async (token) => {
  const response = await fetch(`${API_URL}/cart`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};

export const addToCart = async (token, product) => {
  const response = await fetch(`${API_URL}/cart`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(product),
  });
  return response.json();
};

export const removeFromCart = async (token, productId) => {
  const response = await fetch(`${API_URL}/cart/${productId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}; 