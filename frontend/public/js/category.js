/**
 * Dedicated Category Page Logic - Dual Section Rendering + Filtering/Sorting + Interactivity
 */

let allProducts = [];
let categoryPrefix = '';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Identify current category from filename
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', ''); // 'men', 'women', or 'kids'

    if (!['men', 'women', 'kids'].includes(page)) return;

    categoryPrefix = page === 'kids' ? 'kids' : (page === 'men' ? 'men' : 'women');

    // 2. Fetch all products
    try {
        const response = await fetch('/api/products');
        allProducts = await response.json();
    } catch (e) {
        console.error("Failed to fetch products:", e);
        return;
    }

    // 3. Initial Render
    applyFiltersAndSort();

    // 4. Setup Event Listeners
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');

    if (searchInput) {
        searchInput.addEventListener('input', () => applyFiltersAndSort());
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => applyFiltersAndSort());
    }

    // 5. Setup Header Actions
    setupHeaderActions();
});

function applyFiltersAndSort() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const sortOrder = document.getElementById('sort-select')?.value || 'default';

    // 1. Filter by category prefix AND search term
    let filtered = allProducts.filter(p => {
        const matchesCategory = p.category.toLowerCase().startsWith(categoryPrefix);
        const matchesSearch = p.name.toLowerCase().includes(searchTerm) ||
            (p.description && p.description.toLowerCase().includes(searchTerm));
        return matchesCategory && matchesSearch;
    });

    // 2. Apply Sorting
    if (sortOrder === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
    }

    // 3. Split into Premium and Casual buckets
    const premiumProducts = filtered.filter(p => p.category.toUpperCase().includes('PREMIUM'));
    const casualProducts = filtered.filter(p => p.category.toUpperCase().includes('CASUAL'));

    // 4. Render grids
    renderGrid('premium-grid', premiumProducts);
    renderGrid('casual-grid', casualProducts);
}

function renderGrid(gridId, products) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem; background: #f9f9f9; border-radius: 12px; color: #666;"><i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i><p>No products found matching your criteria.</p></div>';
        return;
    }

    grid.innerHTML = products.map(product => {
        // Star Rating HTML
        let starsHtml = '';
        const rating = product.rating || 4.5;
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }

        const reviews = product.sales_count || Math.floor(Math.random() * 200) + 10;
        const badgeHtml = product.stock <= 5 && product.stock > 0 ? `<div class="card-badge">LOW STOCK</div>` : (product.stock === 0 ? `<div class="card-badge" style="background: #666;">OUT OF STOCK</div>` : '');

        return `
        <div class="modern-card">
            <div class="modern-card-image-wrap">
                ${badgeHtml}
                <button class="wishlist-btn" onclick="toggleWishlist(${product.id}, event)">
                    <i class="far fa-heart"></i>
                </button>
                <img src="${product.image}" loading="lazy" alt="${product.name}">
                <div class="card-actions-overlay">
                    <button class="quick-add-btn" onclick="addToCart(${product.id}, event)">
                        Quick Add <i class="fas fa-plus"></i>
                    </button>
                    <button class="tryon-btn-category" onclick="openTryOn(${product.id}, event)">
                        <i class="fas fa-magic"></i> Try On
                    </button>
                </div>
            </div>
            <div class="modern-card-info">
                <h3 class="modern-card-title">${product.name}</h3>
                <div class="modern-card-price">$${parseFloat(product.price).toFixed(2)}</div>
                <div class="modern-card-rating">
                    ${starsHtml}
                    <span style="color: #999; margin-left: 4px;">(${reviews})</span>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Try-On is handled globally by tryon-system.js

/**
 * INTERACTIVE FEATURES
 */

// Add to Cart Logic

// Wishlist Logic
window.toggleWishlist = function (productId, event) {
    if (event) event.stopPropagation();

    const btn = event.currentTarget;
    const icon = btn.querySelector('i');

    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        icon.style.color = '#e74c3c';
        showNotification('Added to wishlist', 'success');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        icon.style.color = '';
        showNotification('Removed from wishlist');
    }

    // Bounce animation
    btn.style.animation = 'pulse 0.3s ease';
    setTimeout(() => btn.style.animation = '', 300);
};

// Header Actions
function setupHeaderActions() {
    const searchIcon = document.querySelector('.fa-search');
    const heartIcon = document.querySelector('.fa-heart'); // This targets nav one
    const bagIcon = document.querySelector('.fa-shopping-bag');

    if (searchIcon) {
        searchIcon.style.cursor = 'pointer';
        searchIcon.addEventListener('click', () => {
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Tiny highlight effect
                searchInput.style.boxShadow = '0 0 0 4px rgba(0,0,0,0.1)';
                setTimeout(() => searchInput.style.boxShadow = '', 1000);
            }
        });
    }

    if (heartIcon && heartIcon.closest('.nav-actions')) {
        heartIcon.style.cursor = 'pointer';
        heartIcon.addEventListener('click', () => {
            showNotification('Wishlist page coming soon!', 'info');
        });
    }

    if (bagIcon) {
        bagIcon.closest('div').style.cursor = 'pointer';
        bagIcon.closest('div').addEventListener('click', () => {
            showNotification('Shopping bag logic would open here.', 'info');
        });
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    // Base styles if not already in CSS
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        animation: 'slideIn 0.3s ease',
        background: type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#3b82f6')
    });

    const icon = type === 'success' ? 'check-circle' : 'info-circle';
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        notification.style.transition = 'transform 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Inline Animation Styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);
