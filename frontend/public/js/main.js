// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// State Management
let currentProducts = [];
let currentOrders = [];
let currentInventory = [];

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('page-title');

// Modal Elements
const modals = {
    product: document.getElementById('product-modal'),
    order: document.getElementById('order-modal'),
    inventory: document.getElementById('inventory-modal'),
    confirm: document.getElementById('confirm-modal')
};

const forms = {
    product: document.getElementById('product-form'),
    order: document.getElementById('order-form')
};

// Button Elements
const buttons = {
    addProduct: document.getElementById('add-product-btn'),
    addOrder: document.getElementById('add-order-btn'),
    saveProduct: document.getElementById('save-product'),
    saveOrder: document.getElementById('save-order'),
    saveInventory: document.getElementById('save-inventory'),
    confirmDelete: document.getElementById('confirm-delete')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    setupEventListeners();
    loadDashboardData();
});

// Initialize Application
function initializeApp() {
    // Set active page
    showPage('dashboard');

    // Load initial data
    loadProducts();
    loadOrders();
    loadInventory();

    // Set up periodic data refresh
    setInterval(loadDashboardData, 30000); // Refresh every 30 seconds

    // Set up search functionality
    setupSearchFunctionality();
}

// Setup search functionality
function setupSearchFunctionality() {
    // Add search containers to each page if they don't exist
    const productsHeader = document.querySelector('#products-page .page-header');
    if (productsHeader && !document.querySelector('#products-search')) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <input type="text" id="products-search" class="search-input" placeholder="Search products...">
            <button class="filter-btn">
                <i class="fas fa-filter"></i> Filter
            </button>
        `;
        productsHeader.parentNode.insertBefore(searchContainer, productsHeader.nextSibling);

        document.getElementById('products-search').addEventListener('input', function (e) {
            filterProducts(e.target.value);
        });
    }

    const ordersHeader = document.querySelector('#orders-page .page-header');
    if (ordersHeader && !document.querySelector('#orders-search')) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <input type="text" id="orders-search" class="search-input" placeholder="Search orders...">
            <button class="filter-btn">
                <i class="fas fa-filter"></i> Filter
            </button>
        `;
        ordersHeader.parentNode.insertBefore(searchContainer, ordersHeader.nextSibling);

        document.getElementById('orders-search').addEventListener('input', function (e) {
            filterOrders(e.target.value);
        });
    }
}

// Filter products by search term
function filterProducts(searchTerm) {
    const filteredProducts = currentProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tbody = document.querySelector('#products-table tbody');
    if (filteredProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-box"></i>
                    <p>No products found</p>
                    <button class="btn btn-primary" onclick="openProductModal()">
                        <i class="fas fa-plus"></i> Add Product
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredProducts.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category || 'N/A'}</td>
            <td>$${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.stock_quantity || 0}</td>
            <td>${new Date(product.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openProductModal(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter orders by search term
function filterOrders(searchTerm) {
    const filteredOrders = currentOrders.filter(order =>
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tbody = document.querySelector('#orders-table tbody');
    if (filteredOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No orders found</p>
                    <button class="btn btn-primary" onclick="openOrderModal()">
                        <i class="fas fa-plus"></i> Create Order
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredOrders.map(order => {
        const product = currentProducts.find(p => p.id === order.product_id);
        return `
            <tr>
                <td>${order.id}</td>
                <td>
                    <div>${order.customer_name}</div>
                    <div class="text-muted">${order.customer_email}</div>
                </td>
                <td>${product?.name || 'Unknown Product'}</td>
                <td>${order.quantity}</td>
                <td>$${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                <td>
                    <span class="status-badge ${order.status}">
                        ${order.status}
                    </span>
                </td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openOrderModal(${order.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteOrder(${order.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const page = this.dataset.page;
            if (page) {
                e.preventDefault();
                showPage(page);
            }
        });
    });

    // Modal close buttons
    document.querySelectorAll('.close, .close-modal').forEach(button => {
        button.addEventListener('click', function () {
            closeModal();
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function (e) {
        Object.values(modals).forEach(modal => {
            if (e.target === modal) {
                closeModal();
            }
        });
    });

    // Form submissions
    buttons.saveProduct?.addEventListener('click', saveProduct);
    buttons.saveOrder?.addEventListener('click', saveOrder);
    buttons.confirmDelete?.addEventListener('click', confirmDelete);

    // Add buttons
    buttons.addProduct?.addEventListener('click', () => openProductModal());
    buttons.addOrder?.addEventListener('click', () => openOrderModal());

    // Inventory
    document.getElementById('save-inventory')?.addEventListener('click', saveInventory);
}

// Page Navigation
function showPage(pageName) {
    // Update active nav link
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        }
    });

    // Show active page
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === `${pageName}-page`) {
            page.classList.add('active');
        }
    });

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        products: 'Products',
        inventory: 'Inventory',
        orders: 'Orders'
    };
    pageTitle.textContent = titles[pageName] || 'Dashboard';

    // Load page-specific data
    switch (pageName) {
        case 'products':
            renderProductsTable();
            break;
        case 'inventory':
            renderInventoryTable();
            break;
        case 'orders':
            renderOrdersTable();
            break;
        case 'dashboard':
            loadDashboardData();
            break;
    }
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        showNotification('Error connecting to server', 'error');
        throw error;
    }
}

// Data Loading Functions
async function loadProducts() {
    try {
        currentProducts = await apiRequest('/products');
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

async function loadOrders() {
    try {
        currentOrders = await apiRequest('/orders');
    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

async function loadInventory() {
    try {
        currentInventory = await apiRequest('/inventory');
    } catch (error) {
        console.error('Failed to load inventory:', error);
    }
}

// Dashboard Functions
async function loadDashboardData() {
    await Promise.all([loadProducts(), loadOrders(), loadInventory()]);

    // Update statistics
    document.getElementById('total-products').textContent = currentProducts.length;
    document.getElementById('total-orders').textContent = currentOrders.length;

    // Calculate low stock items
    const lowStockItems = currentInventory.filter(item => item.stock_quantity <= item.min_stock_level || 10);
    document.getElementById('low-stock').textContent = lowStockItems.length;

    // Calculate total revenue
    const totalRevenue = currentOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;

    // Render recent orders
    renderRecentOrders();

    // Render low stock alerts
    renderLowStockAlerts();
}

function renderRecentOrders() {
    const container = document.getElementById('recent-orders');
    const recentOrders = currentOrders.slice(-5).reverse();

    if (recentOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No orders yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = recentOrders.map(order => {
        const product = currentProducts.find(p => p.id === order.product_id);
        return `
            <div class="activity-item card-hover">
                <div class="activity-details">
                    <h4>Order #${order.id} - ${order.customer_name}</h4>
                    <p>${product?.name || 'Unknown Product'} × ${order.quantity}</p>
                    <small class="text-muted">${new Date(order.created_at).toLocaleString()}</small>
                </div>
                <span class="activity-status status-${order.status}">${order.status}</span>
            </div>
        `;
    }).join('');
}

function renderLowStockAlerts() {
    const container = document.getElementById('stock-alerts');
    const lowStockItems = currentInventory
        .filter(item => item.stock_quantity <= (item.min_stock_level || 10))
        .slice(0, 5);

    if (lowStockItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>All stock levels are good</p>
            </div>
        `;
        return;
    }

    container.innerHTML = lowStockItems.map(item => {
        const product = currentProducts.find(p => p.id === item.product_id);
        return `
            <div class="activity-item card-hover">
                <div class="activity-details">
                    <h4>${product?.name || 'Unknown Product'}</h4>
                    <p>Current: ${item.stock_quantity} | Min: ${item.min_stock_level || 10}</p>
                    <small class="text-muted">Last updated: ${new Date(item.last_updated).toLocaleDateString()}</small>
                </div>
                <span class="activity-status status-low">LOW STOCK</span>
            </div>
        `;
    }).join('');
}

// Enhanced table rendering with sorting
function sortTable(column, direction = 'asc', tableId) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
        const aValue = a.cells[column].textContent.trim();
        const bValue = b.cells[column].textContent.trim();

        if (direction === 'asc') {
            return aValue.localeCompare(bValue, undefined, { numeric: true });
        } else {
            return bValue.localeCompare(aValue, undefined, { numeric: true });
        }
    });

    // Clear the table and re-add sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}

function renderLowStockAlerts() {
    const container = document.getElementById('stock-alerts');
    const lowStockItems = currentInventory
        .filter(item => item.stock_quantity <= (item.min_stock_level || 10))
        .slice(0, 5);

    if (lowStockItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>All stock levels are good</p>
            </div>
        `;
        return;
    }

    container.innerHTML = lowStockItems.map(item => {
        const product = currentProducts.find(p => p.id === item.product_id);
        return `
            <div class="activity-item">
                <div class="activity-details">
                    <h4>${product?.name || 'Unknown Product'}</h4>
                    <p>Stock: ${item.stock_quantity} (Min: ${item.min_stock_level || 10})</p>
                </div>
                <span class="activity-status status-low">LOW STOCK</span>
            </div>
        `;
    }).join('');
}

// Product Management
function renderProductsTable() {
    const tbody = document.querySelector('#products-table tbody');

    if (currentProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-box"></i>
                    <p>No products found</p>
                    <button class="btn btn-primary" onclick="openProductModal()">
                        <i class="fas fa-plus"></i> Add Product
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = currentProducts.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category || 'N/A'}</td>
            <td>$${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.stock_quantity || 0}</td>
            <td>${new Date(product.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openProductModal(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openProductModal(productId = null) {
    const modal = modals.product;
    const title = document.getElementById('product-modal-title');
    const form = forms.product;

    if (productId) {
        // Edit mode
        title.textContent = 'Edit Product';
        const product = currentProducts.find(p => p.id === productId);
        if (product) {
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-description').value = product.description || '';
            document.getElementById('product-category').value = product.category || '';
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-stock').value = product.stock_quantity || 0;
        }
    } else {
        // Add mode
        title.textContent = 'Add Product';
        form.reset();
        document.getElementById('product-id').value = '';
    }

    modal.classList.add('active');
}

async function saveProduct() {
    const form = forms.product;
    const id = document.getElementById('product-id').value;

    const productData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        category: document.getElementById('product-category').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock_quantity: parseInt(document.getElementById('product-stock').value)
    };

    try {
        if (id) {
            // Update existing product
            await apiRequest(`/products/${id}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
            showNotification('Product updated successfully', 'success');
        } else {
            // Create new product
            await apiRequest('/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            showNotification('Product created successfully', 'success');
        }

        closeModal();
        await loadProducts();
        renderProductsTable();
        loadDashboardData(); // Refresh dashboard
    } catch (error) {
        showNotification('Failed to save product', 'error');
    }
}

async function deleteProduct(id) {
    window.deleteTarget = { type: 'product', id };
    modals.confirm.classList.add('active');
}

// Inventory Management
function renderInventoryTable() {
    const tbody = document.querySelector('#inventory-table tbody');

    if (currentInventory.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-warehouse"></i>
                    <p>No inventory items found</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = currentInventory.map(item => {
        const product = currentProducts.find(p => p.id === item.product_id);
        const isLowStock = item.stock_quantity <= (item.min_stock_level || 10);

        return `
            <tr>
                <td>${item.product_id}</td>
                <td>${product?.name || 'Unknown Product'}</td>
                <td class="${isLowStock ? 'stock-low' : 'stock-ok'}">${item.stock_quantity}</td>
                <td>${item.min_stock_level || 10}</td>
                <td>
                    <span class="status-badge ${isLowStock ? 'cancelled' : 'completed'}">
                        ${isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                    </span>
                </td>
                <td>${new Date(item.last_updated).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="updateInventory(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Order Management
function renderOrdersTable() {
    const tbody = document.querySelector('#orders-table tbody');

    if (currentOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No orders found</p>
                    <button class="btn btn-primary" onclick="openOrderModal()">
                        <i class="fas fa-plus"></i> Create Order
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = currentOrders.map(order => {
        const product = currentProducts.find(p => p.id === order.product_id);
        return `
            <tr>
                <td>${order.id}</td>
                <td>
                    <div>${order.customer_name}</div>
                    <div class="text-muted">${order.customer_email}</div>
                </td>
                <td>${product?.name || 'Unknown Product'}</td>
                <td>${order.quantity}</td>
                <td>$${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                <td>
                    <span class="status-badge ${order.status}">
                        ${order.status}
                    </span>
                </td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openOrderModal(${order.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteOrder(${order.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openOrderModal(orderId = null) {
    const modal = modals.order;
    const title = document.getElementById('order-modal-title');
    const form = forms.order;

    // Populate product dropdown
    const productSelect = document.getElementById('product-select');
    productSelect.innerHTML = '<option value="">Select a product</option>' +
        currentProducts.map(product =>
            `<option value="${product.id}">${product.name}</option>`
        ).join('');

    if (orderId) {
        // Edit mode
        title.textContent = 'Edit Order';
        const order = currentOrders.find(o => o.id === orderId);
        if (order) {
            document.getElementById('order-id').value = order.id;
            document.getElementById('customer-name').value = order.customer_name;
            document.getElementById('customer-email').value = order.customer_email;
            document.getElementById('product-select').value = order.product_id;
            document.getElementById('order-quantity').value = order.quantity;
            document.getElementById('order-status').value = order.status;
        }
    } else {
        // Add mode
        title.textContent = 'Create Order';
        form.reset();
        document.getElementById('order-id').value = '';
        document.getElementById('order-status').value = 'pending';
    }

    modal.classList.add('active');
}

async function saveOrder() {
    const form = forms.order;
    const id = document.getElementById('order-id').value;
    const productId = parseInt(document.getElementById('product-select').value);

    if (!productId) {
        showNotification('Please select a product', 'error');
        return;
    }

    const product = currentProducts.find(p => p.id === productId);
    const quantity = parseInt(document.getElementById('order-quantity').value);
    const price = parseFloat(product.price);

    const orderData = {
        customer_name: document.getElementById('customer-name').value,
        customer_email: document.getElementById('customer-email').value,
        product_id: productId,
        quantity: quantity,
        total_amount: price * quantity,
        status: document.getElementById('order-status').value
    };

    try {
        if (id) {
            // Update existing order
            await apiRequest(`/orders/${id}`, {
                method: 'PUT',
                body: JSON.stringify(orderData)
            });
            showNotification('Order updated successfully', 'success');
        } else {
            // Create new order
            await apiRequest('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
            showNotification('Order created successfully', 'success');
        }

        closeModal();
        await loadOrders();
        await loadInventory(); // Refresh inventory after order
        renderOrdersTable();
        loadDashboardData(); // Refresh dashboard
    } catch (error) {
        showNotification('Failed to save order', 'error');
    }
}

async function deleteOrder(id) {
    window.deleteTarget = { type: 'order', id };
    modals.confirm.classList.add('active');
}

// Modal Functions
function closeModal() {
    Object.values(modals).forEach(modal => {
        modal.classList.remove('active');
    });
    window.deleteTarget = null;
}

// Delete Confirmation
async function confirmDelete() {
    if (!window.deleteTarget) return;

    const { type, id } = window.deleteTarget;

    try {
        await apiRequest(`/${type}s/${id}`, {
            method: 'DELETE'
        });

        showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`, 'success');
        closeModal();

        // Refresh data
        if (type === 'product') {
            await loadProducts();
            await loadInventory();
            renderProductsTable();
        } else if (type === 'order') {
            await loadOrders();
            await loadInventory();
            renderOrdersTable();
        }

        loadDashboardData();
    } catch (error) {
        showNotification(`Failed to delete ${type}`, 'error');
    }
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
        }
        .notification-success { background: #4cc9f0; }
        .notification-error { background: #e63946; }
        .notification-info { background: #4361ee; }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Inventory Update Function
function openInventoryModal(id) {
    const item = currentInventory.find(i => i.id === id);
    if (!item) return;

    document.getElementById('inventory-id').value = item.id;
    document.getElementById('inventory-stock').value = item.stock_quantity;
    document.getElementById('inventory-min').value = item.min_stock_level || 10;

    modals.inventory.classList.add('active');
}

window.updateInventory = openInventoryModal;

async function saveInventory() {
    const id = document.getElementById('inventory-id').value;
    const stock_quantity = parseInt(document.getElementById('inventory-stock').value);
    const min_stock_level = parseInt(document.getElementById('inventory-min').value);

    if (isNaN(stock_quantity) || stock_quantity < 0) {
        showNotification('Please enter a valid stock quantity', 'error');
        return;
    }

    try {
        await apiRequest(`/inventory/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ stock_quantity, min_stock_level })
        });

        showNotification('Inventory updated successfully', 'success');
        modals.inventory.classList.remove('active');

        await loadInventory();
        renderInventoryTable();
        loadDashboardData();
    } catch (error) {
        showNotification('Failed to update inventory', 'error');
    }
}