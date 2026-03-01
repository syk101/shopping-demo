// API Configuration
const API_BASE_URL = '/api';

// State Management
let currentProducts = [];
let currentOrders = [];
let currentInventory = [];
let currentEmployees = [];

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('page-title');

let currentProductTable = 'man_PREMIUM'; // initial table

// Modal Elements
const modals = {
    product: document.getElementById('product-modal'),
    order: document.getElementById('order-modal'),
    inventory: document.getElementById('inventory-modal'),
    employee: document.getElementById('employee-modal'),
    confirm: document.getElementById('confirm-modal')
};

const forms = {
    product: document.getElementById('product-form'),
    order: document.getElementById('order-form'),
    employee: document.getElementById('employee-form')
};

// Button Elements
const buttons = {
    addProduct: document.getElementById('add-product-btn'),
    addOrder: document.getElementById('add-order-btn'),
    addEmployee: document.getElementById('add-employee-btn'),
    saveProduct: document.getElementById('save-product'),
    saveOrder: document.getElementById('save-order'),
    saveEmployee: document.getElementById('save-employee'),
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
    loadEmployees();

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

    // Employee search
    const employeeSearch = document.getElementById('employee-search');
    if (employeeSearch) {
        employeeSearch.addEventListener('input', function (e) {
            filterEmployees(e.target.value);
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
                <td colspan="9" class="empty-state">
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

    tbody.innerHTML = filteredProducts.map(product => {
        const imageUrl = product.image_data ? 'data:image/jpeg;base64,' + product.image_data : 'https://via.placeholder.com/50';
        return `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.description || 'No description'}</td>
            <td><img src="${imageUrl}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
            <td>${product.table_name || 'N/A'}</td>
            <td>$${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.stock_quantity || 0}</td>
            <td>${new Date(product.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openProductModal(${product.id}, '${product.table_name}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id}, '${product.table_name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
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
        const product = currentProducts.find(p => p.id === order.product_id && p.table_name === order.product_category);
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
    buttons.saveEmployee?.addEventListener('click', saveEmployee);
    buttons.confirmDelete?.addEventListener('click', confirmDelete);

    // Add buttons
    buttons.addProduct?.addEventListener('click', () => openProductModal());
    document.getElementById('add-product-btn-bottom')?.addEventListener('click', () => openProductModal());
    buttons.addOrder?.addEventListener('click', () => openOrderModal());
    buttons.addEmployee?.addEventListener('click', () => openEmployeeModal());

    // Inventory
    document.getElementById('save-inventory')?.addEventListener('click', saveInventory);

    // Category tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentProductTable = e.target.dataset.table;
            renderProductsTable();
        });
    });
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
        orders: 'Orders',
        employees: 'Employee Management'
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
        case 'employees':
            renderEmployeesTable();
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

async function loadEmployees() {
    try {
        currentEmployees = await apiRequest('/employees');
    } catch (error) {
        console.error('Failed to load employees:', error);
    }
}

async function loadDashboardData() {
    await Promise.all([loadProducts(), loadOrders(), loadInventory()]);

    // Update statistics
    document.getElementById('total-products').textContent = currentProducts.length;
    document.getElementById('total-orders').textContent = currentOrders.length;

    // Calculate low stock items
    const lowStockItems = currentInventory.filter(item => item.stock_quantity <= (item.min_stock_level || 10));
    document.getElementById('low-stock').textContent = lowStockItems.length;

    // Calculate total revenue
    const totalRevenue = currentOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);
    document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;

    // Render recent orders
    renderRecentOrders();

    // Render low stock alerts
    renderLowStockAlerts();

    // Load and render trends
    loadAndRenderTrends();
}

async function loadAndRenderTrends() {
    try {
        const trends = await apiRequest('/stats/trends');

        // Render Revenue Trend
        renderSparkline('chart-revenue', trends.revenue, 'Revenue', '#2563eb');
        updateTrendPercent('revenue-trend-percent', trends.revenue);

        // Render Orders Trend
        renderSparkline('chart-orders', trends.orders, 'Orders', '#10b981');
        updateTrendPercent('orders-trend-percent', trends.orders);

        // Render Stock Trend (distribution)
        renderSparkline('chart-products', trends.stock, 'Stock', '#f59e0b');

    } catch (error) {
        console.error('Failed to load trends:', error);
    }
}

function renderSparkline(canvasId, data, label, color) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Check if chart already exists and destroy it
    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }

    // Determine color based on trend
    const lastValue = data[data.length - 1];
    const prevValue = data[data.length - 2] || 0;
    const trendColor = lastValue >= prevValue ? '#10b981' : '#ef4444';

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map((_, i) => i),
            datasets: [{
                label: label,
                data: data,
                borderColor: trendColor,
                borderWidth: 2,
                pointRadius: 0,
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, canvas } = chart;
                    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                    gradient.addColorStop(0, trendColor + '33'); // 20% opacity
                    gradient.addColorStop(1, trendColor + '00'); // 0% opacity
                    return gradient;
                },
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuad'
            }
        }
    });
}

function updateTrendPercent(elementId, data) {
    const el = document.getElementById(elementId);
    if (!el || data.length < 2) return;

    const last = data[data.length - 1];
    const prev = data[data.length - 2] || 0;

    let percent = 0;
    if (prev > 0) {
        percent = ((last - prev) / prev) * 100;
    } else if (last > 0) {
        percent = 100;
    }

    const isUp = percent >= 0;
    el.className = `stat-trend ${isUp ? 'trend-up' : 'trend-down'}`;
    el.innerHTML = `<i class="fas fa-caret-${isUp ? 'up' : 'down'}"></i> ${Math.abs(percent).toFixed(1)}% vs yesterday`;
}

function renderRecentOrders() {
    const container = document.getElementById('dashboard-activity-feed');
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
        const product = currentProducts.find(p => p.id === order.product_id && p.table_name === order.product_category);
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
        const product = currentProducts.find(p => p.id === item.product_id && p.table_name === item.table);
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


// Product Management
function renderProductsTable() {
    const tbody = document.querySelector('#products-table tbody');
    const filteredProducts = currentProducts.filter(p => p.table_name === currentProductTable);

    if (filteredProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
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

    tbody.innerHTML = filteredProducts.map(product => {
        const imageUrl = product.image_data ? 'data:image/jpeg;base64,' + product.image_data : 'https://via.placeholder.com/50';
        return `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.description || 'No description'}</td>
            <td><img src="${imageUrl}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
            <td>${product.table_name || 'N/A'}</td>
            <td>$${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.stock_quantity || 0}</td>
            <td>${new Date(product.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openProductModal(${product.id}, '${product.table_name}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id}, '${product.table_name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `}).join('');
}

function openProductModal(productId = null, tableName = null) {
    const modal = modals.product;
    const title = document.getElementById('product-modal-title');
    const form = forms.product;

    // Clear image elements
    document.getElementById('product-image').value = '';
    const imgPreview = document.getElementById('image-preview');
    imgPreview.innerHTML = '';

    if (productId) {
        // Edit mode
        title.textContent = 'Edit Product';
        const product = currentProducts.find(p => p.id === productId && p.table_name === tableName);
        if (product) {
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-description').value = product.description || '';
            document.getElementById('product-category').value = product.table_name || '';
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-stock').value = product.stock_quantity || 0;

            if (product.image_data) {
                imgPreview.innerHTML = `<img src="data:image/jpeg;base64,${product.image_data}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">`;
            }
        }
    } else {
        // Add mode
        title.textContent = 'Add Product';
        form.reset();
        document.getElementById('product-id').value = '';
        document.getElementById('product-category').value = currentProductTable;
    }

    modal.classList.add('active');
}

async function saveProduct() {
    const form = forms.product;
    const id = document.getElementById('product-id').value;
    const tableName = document.getElementById('product-category').value || currentProductTable;

    const productData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock_quantity: parseInt(document.getElementById('product-stock').value)
    };

    // Process image
    const fileInput = document.getElementById('product-image');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const base64String = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
        productData.image_data = base64String; // Backend expects image_data to contain base64 string
    }

    try {
        if (id) {
            // Update existing product
            await apiRequest(`/products/${tableName}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
            showNotification('Product updated successfully', 'success');
        } else {
            // Create new product
            await apiRequest(`/products/${tableName}`, {
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

// Add event listener for image preview
document.getElementById('product-image')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('image-preview').innerHTML = `<img src="${e.target.result}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">`;
        }
        reader.readAsDataURL(file);
    }
});

// Employee Management
function renderEmployeesTable() {
    const tbody = document.querySelector('#employees-table tbody');

    if (currentEmployees.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>No employees found</p>
                    <button class="btn btn-primary" onclick="openEmployeeModal()">
                        <i class="fas fa-plus"></i> Create Employee
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = currentEmployees.map(emp => {
        const imageUrl = emp.image_data ? 'data:image/jpeg;base64,' + emp.image_data : 'https://via.placeholder.com/50';
        return `
            <tr>
                <td>${emp.id}</td>
                <td><img src="${imageUrl}" alt="${emp.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0;"></td>
                <td style="font-weight: 500;">${emp.name}</td>
                <td>$${parseFloat(emp.salary).toFixed(2)}</td>
                <td>${emp.working_hours}h</td>
                <td><span class="status-badge status-processing text-capitalize">${emp.shift}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openEmployeeModal(${emp.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${emp.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterEmployees(searchTerm) {
    const filtered = currentEmployees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.shift.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tbody = document.querySelector('#employees-table tbody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><p>No matching employees found</p></td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(emp => {
        const imageUrl = emp.image_data ? 'data:image/jpeg;base64,' + emp.image_data : 'https://via.placeholder.com/50';
        return `
            <tr>
                <td>${emp.id}</td>
                <td><img src="${imageUrl}" alt="${emp.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0;"></td>
                <td style="font-weight: 500;">${emp.name}</td>
                <td>$${parseFloat(emp.salary).toFixed(2)}</td>
                <td>${emp.working_hours}h</td>
                <td><span class="status-badge status-processing text-capitalize">${emp.shift}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openEmployeeModal(${emp.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${emp.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function openEmployeeModal(employeeId = null) {
    const title = document.getElementById('employee-modal-title');
    const form = forms.employee;
    const preview = document.getElementById('employee-image-preview');

    preview.innerHTML = '';
    document.getElementById('employee-image').value = '';

    if (employeeId) {
        title.textContent = 'Edit Employee';
        const emp = currentEmployees.find(e => e.id === employeeId);
        if (emp) {
            document.getElementById('employee-id').value = emp.id;
            document.getElementById('employee-name').value = emp.name;
            document.getElementById('employee-salary').value = emp.salary;
            document.getElementById('employee-hours').value = emp.working_hours;
            document.getElementById('employee-shift').value = emp.shift;
            if (emp.image_data) {
                preview.innerHTML = `<img src="data:image/jpeg;base64,${emp.image_data}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">`;
            }
        }
    } else {
        title.textContent = 'Create Employee';
        form.reset();
        document.getElementById('employee-id').value = '';
    }

    modals.employee.classList.add('active');
}

async function saveEmployee() {
    const id = document.getElementById('employee-id').value;
    const empData = {
        name: document.getElementById('employee-name').value,
        salary: parseFloat(document.getElementById('employee-salary').value),
        working_hours: parseInt(document.getElementById('employee-hours').value),
        shift: document.getElementById('employee-shift').value
    };

    const fileInput = document.getElementById('employee-image');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const base64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });
        empData.image_data = base64;
    }

    try {
        if (id) {
            await apiRequest(`/employees/${id}`, {
                method: 'PUT',
                body: JSON.stringify(empData)
            });
            showNotification('Employee updated successfully', 'success');
        } else {
            await apiRequest('/employees', {
                method: 'POST',
                body: JSON.stringify(empData)
            });
            showNotification('Employee created successfully', 'success');
        }
        closeModal();
        await loadEmployees();
        renderEmployeesTable();
    } catch (error) {
        showNotification('Failed to save employee', 'error');
    }
}

async function deleteEmployee(id) {
    window.deleteTarget = { type: 'employee', id };
    modals.confirm.classList.add('active');
}

// Add event listener for employee image preview
document.getElementById('employee-image')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('employee-image-preview').innerHTML = `<img src="${e.target.result}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;">`;
        }
        reader.readAsDataURL(file);
    }
});

async function deleteProduct(id, tableName) {
    window.deleteTarget = { type: 'product', id, tableName };
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
        const product = currentProducts.find(p => p.id === item.product_id && p.table_name === item.table);
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
        return `
            <tr>
                <td>${order.id}</td>
                <td>
                    <div style="font-weight: 500;">${order.customer_name}</div>
                    <div class="text-muted" style="font-size: 0.8rem;">${new Date(order.created_at).toLocaleDateString()}</div>
                </td>
                <td>${order.phone || 'N/A'}</td>
                <td>${order.address || 'N/A'}</td>
                <td>
                    <div>${order.product_name || 'Unknown Product'}</div>
                    <div class="text-muted" style="font-size: 0.8rem;">${(order.product_category || '').replace('_', ' ')}</div>
                </td>
                <td>${order.quantity}</td>
                <td><span style="font-weight: 600;">$${parseFloat(order.total_price || 0).toFixed(2)}</span></td>
                <td>
                    <span class="status-badge ${order.status}">
                        ${order.status}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="openOrderModal(${order.id})" title="Edit Order">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteOrder(${order.id})" title="Delete Order">
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

    const categorySelect = document.getElementById('order-product-category');
    const productSelect = document.getElementById('order-product-select');

    // Helper to populate products based on selected category
    const populateProducts = (category) => {
        const filteredProducts = currentProducts.filter(p => p.table_name === category);
        productSelect.innerHTML = '<option value="">Select a product</option>' +
            filteredProducts.map(product =>
                `<option value="${product.id}" data-price="${product.price}">${product.name} ($${product.price})</option>`
            ).join('');
    };

    // Replace old listeners to prevent stacking
    const newCategorySelect = categorySelect.cloneNode(true);
    categorySelect.parentNode.replaceChild(newCategorySelect, categorySelect);
    newCategorySelect.addEventListener('change', (e) => populateProducts(e.target.value));

    // Initialize with first category
    populateProducts(newCategorySelect.value);

    if (orderId) {
        // Edit mode
        title.textContent = 'Edit Order';
        const order = currentOrders.find(o => o.id === orderId);
        if (order) {
            document.getElementById('order-id').value = order.id;
            document.getElementById('customer-name').value = order.customer_name;
            document.getElementById('customer-phone').value = order.phone || '';
            document.getElementById('customer-address').value = order.address || '';
            newCategorySelect.value = order.product_category || 'man_PREMIUM';
            populateProducts(newCategorySelect.value);
            document.getElementById('order-product-select').value = order.product_id;
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
    const productSelect = document.getElementById('order-product-select');
    const productId = parseInt(productSelect.value);
    const category = document.getElementById('order-product-category').value;

    if (!productId) {
        showNotification('Please select a product', 'error');
        return;
    }

    const selectedOption = productSelect.options[productSelect.selectedIndex];
    const price = parseFloat(selectedOption.getAttribute('data-price') || 0);
    const quantity = parseInt(document.getElementById('order-quantity').value);

    const orderData = {
        customer_name: document.getElementById('customer-name').value,
        phone: document.getElementById('customer-phone').value,
        address: document.getElementById('customer-address').value,
        product_category: category,
        product_id: productId,
        quantity: quantity,
        total_price: price * quantity,
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

    const { type, id, tableName } = window.deleteTarget;

    try {
        let endpoint = `/${type}s/${id}`;
        if (type === 'product') {
            endpoint = `/products/${tableName}/${id}`;
        }

        await apiRequest(endpoint, {
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
        } else if (type === 'employee') {
            await loadEmployees();
            renderEmployeesTable();
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