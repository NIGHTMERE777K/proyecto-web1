// Configuración de la API
const API_URL = 'https://api.example.com'; // Reemplazar con tu API real

// Importar funciones de la API
import { register, login, getCart, addToCart, removeFromCart } from './api.js';

// Estado global de la aplicación
let currentUser = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Función para cargar el menú desde la API
async function cargarMenu() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        const menu = await response.json();
        mostrarMenu(menu);
    } catch (error) {
        console.error('Error al cargar el menú:', error);
    }
}

// Función para mostrar el menú en la página
function mostrarMenu(menu) {
    const menuContainer = document.getElementById('menu-container');
    if (!menuContainer) return;

    menuContainer.innerHTML = menu.map(item => `
        <div class="col-md-4">
            <div class="card bg-dark text-light">
                <img src="${item.imagen}" class="card-img-top" alt="${item.nombre}">
                <div class="card-body">
                    <h5 class="card-title">${item.nombre}</h5>
                    <p class="card-text">${item.descripcion}</p>
                    <p class="card-text"><strong>Precio: $${item.precio}</strong></p>
                </div>
            </div>
        </div>
    `).join('');
}

// Función para manejar el registro
async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await register(email, password);
        if (response.token) {
            localStorage.setItem('token', response.token);
            currentUser = { email };
            showUserInterface();
        } else {
            alert('Error en el registro: ' + response.message);
        }
    } catch (error) {
        alert('Error en el registro: ' + error.message);
    }
}

// Función para manejar el inicio de sesión
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await login(email, password);
        if (response.token) {
            localStorage.setItem('token', response.token);
            currentUser = { email };
            showUserInterface();
            loadCart();
        } else {
            alert('Error en el inicio de sesión: ' + response.message);
        }
    } catch (error) {
        alert('Error en el inicio de sesión: ' + error.message);
    }
}

// Función para cargar el carrito
async function loadCart() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        cart = await getCart(token);
        updateCartUI();
    } catch (error) {
        console.error('Error al cargar el carrito:', error);
    }
}

// Función para actualizar la interfaz del carrito
function updateCartUI() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;

    // Actualizar el contador del carrito
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-badge').textContent = totalItems;

    // Actualizar el contenido del carrito
    cartContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div>
                <h6>${item.name}</h6>
                <small>Cantidad: ${item.quantity}</small>
            </div>
            <div class="text-end">
                <div>$${item.price * item.quantity}</div>
                <button class="btn btn-sm btn-danger" onclick="handleRemoveFromCart('${item.productId}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cart-total').textContent = `Total: $${total}`;

    // Actualizar el estado del botón de checkout
    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.disabled = cart.length === 0;
    }
}

// Función para formatear precios en pesos colombianos
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

// Función para actualizar el badge del carrito
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        badge.textContent = totalItems;
    }
}

// Función para actualizar el carrito en el modal
function updateCartModal() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (cartItems && cartTotal) {
        cartItems.innerHTML = '';
        let total = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item mb-3 p-3 border-bottom';
            itemElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">${item.name}</h6>
                        <small class="text-muted">${formatPrice(item.price)} x ${item.quantity}</small>
                    </div>
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${index}, ${item.quantity - 1})">-</button>
                            <span class="mx-2">${item.quantity}</span>
                            <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
                        </div>
                        <div class="text-end">
                            <div class="fw-bold">${formatPrice(itemTotal)}</div>
                            <button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            cartItems.appendChild(itemElement);
        });

        cartTotal.textContent = `Total: ${formatPrice(total)}`;
    }
}

// Función para agregar al carrito
window.handleAddToCart = function(product) {
    console.log('Agregando al carrito:', product); // Debug
    const existingItem = cart.find(item => item.productId === product.productId);
    
    if (existingItem) {
        existingItem.quantity += product.quantity;
    } else {
        cart.push(product);
    }
    
    saveCart();
    updateCartBadge();
    updateCartModal();
    
    // Mostrar mensaje de confirmación
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '5';
    toast.innerHTML = `
        <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto">Carrito</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${product.name} agregado al carrito
            </div>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// Función para actualizar cantidad
window.updateQuantity = function(index, newQuantity) {
    if (newQuantity > 0) {
        cart[index].quantity = newQuantity;
        saveCart();
        updateCartBadge();
        updateCartModal();
    } else {
        removeFromCart(index);
    }
};

// Función para eliminar del carrito
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartBadge();
    updateCartModal();
};

// Función para guardar el carrito en localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Función para limpiar el carrito
window.clearCart = function() {
    cart = [];
    saveCart();
    updateCartBadge();
    updateCartModal();
};

// Función para mostrar la interfaz de usuario
function showUserInterface() {
    document.getElementById('auth-forms').style.display = 'none';
    document.getElementById('user-interface').style.display = 'block';
    document.getElementById('user-email').textContent = currentUser.email;
}

// Función para cerrar sesión
function handleLogout() {
    localStorage.removeItem('token');
    currentUser = null;
    cart = [];
    document.getElementById('auth-forms').style.display = 'block';
    document.getElementById('user-interface').style.display = 'none';
    updateCartUI();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay una sesión activa
    const token = localStorage.getItem('token');
    if (token) {
        currentUser = { email: 'usuario@ejemplo.com' };
        showUserInterface();
        loadCart();
    }

    // Agregar event listeners para los formularios
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('logout-button')?.addEventListener('click', handleLogout);
    
    // Event listener para el botón de checkout
    document.getElementById('checkout-button')?.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('El carrito está vacío');
            return;
        }
        
        alert('¡Gracias por tu pedido! Te contactaremos pronto.');
        clearCart();
    });

    // Inicializar el carrito al cargar la página
    console.log('Página cargada, inicializando carrito...'); // Debug
    updateCartBadge();
    updateCartModal();
});

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    cargarMenu();
});