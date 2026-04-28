/**
 * Dynamic Products Filter Engine - Premium UI Upgrade
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 2. Parse URL Parameters
    const urlParams = new URLSearchParams(window.location.search);
    const selectedCategory = urlParams.get('category');
    const selectedCollection = urlParams.get('collection');

    // Update UI Headers based on category
    updatePageHeaders(selectedCategory, selectedCollection);

    let PRODUCT_DATABASE = [];
    try {
        const response = await fetch('/api/products');
        const dbProducts = await response.json();

        PRODUCT_DATABASE = dbProducts.map(p => {
            let collection = '';
            let category = '';

            const cat = p.category;
            if (cat === 'men_PREMIUM') { collection = 'mens'; category = 'suits'; }
            if (cat === 'men_CASUAL') { collection = 'mens'; category = 'casual'; }
            if (cat === 'women_PREMIUM') { collection = 'womens'; category = 'evening'; }
            if (cat === 'women_CASUAL') { collection = 'womens'; category = 'everyday'; }
            if (cat === 'kids_PREMIUM') { collection = 'kids'; category = 'school'; }
            if (cat === 'kids_CASUAL') { collection = 'kids'; category = 'playtime'; }

            let imageUrl = p.image || 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80';

            return {
                id: p.id.toString(),
                name: p.name,
                price: parseFloat(p.price) || 0,
                category: category,
                collection: collection,
                image: imageUrl,
                rating: p.rating || 4.5,
                reviews: p.sales_count || Math.floor(Math.random() * 200) + 10,
                badge: p.stock <= 5 && p.stock > 0 ? 'LOW STOCK' : (p.stock === 0 ? 'OUT OF STOCK' : '')
            };
        });
    } catch (e) {
        console.error("Failed to fetch products from DB:", e);
    }

    // 3. Filter the Database
    let filteredProducts = PRODUCT_DATABASE;
    if (selectedCategory) {
        filteredProducts = filteredProducts.filter(p => p.category === selectedCategory);
    }
    if (selectedCollection && !selectedCategory) {
        filteredProducts = filteredProducts.filter(p => p.collection === selectedCollection);
    }

    // Default Sorting
    renderProductGrid(filteredProducts);

    // 4. Handle Sorting Events
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            let sorted = [...filteredProducts];
            if (e.target.value === 'price-low') {
                sorted.sort((a, b) => a.price - b.price);
            } else if (e.target.value === 'price-high') {
                sorted.sort((a, b) => b.price - a.price);
            } else if (e.target.value === 'newest') {
                sorted.sort((a, b) => b.id.localeCompare(a.id));
            }
            renderProductGrid(sorted);
        });
    }
});

function updatePageHeaders(category, collection) {
    const titleElement = document.getElementById('category-title');
    const subtitleElement = document.getElementById('category-subtitle');
    const breadcrumbElement = document.getElementById('breadcrumb-current');

    const titles = {
        'suits': "Men's Tailoring",
        'casual': "Men's Casual",
        'evening': "Women's Evening Wear",
        'everyday': "Women's Essentials",
        'playtime': "Kids' Playtime",
        'school': "Kids' Uniforms"
    };

    const subtitles = {
        'suits': "Exquisite tailoring and premium Italian fabrics",
        'casual': "Elevated essentials for a modern lifestyle",
        'evening': "Stunning silhouettes for unforgettable moments",
        'everyday': "Effortless pieces designed for daily comfort",
        'playtime': "Playful and durable designs for everyday adventures",
        'school': "Smart, comfortable, and made to last the school year"
    };

    if (category && titles[category]) {
        titleElement.textContent = titles[category];
        subtitleElement.textContent = subtitles[category];
        breadcrumbElement.textContent = titles[category];
        document.title = `${titles[category]} | Weary Shop`;
    }
}

function renderProductGrid(products) {
    const grid = document.getElementById('dynamic-products-grid');
    const countDisplay = document.getElementById('results-count-number');
    const emptyMessage = document.getElementById('no-products-message');

    if (!grid) return;

    countDisplay.textContent = products.length;

    if (products.length === 0) {
        grid.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyMessage.style.display = 'none';

    grid.innerHTML = products.map(product => {
        // Generate Star Rating HTML
        let starsHtml = '';
        const fullStars = Math.floor(product.rating);
        const hasHalfStar = product.rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }
        const emptyStars = 5 - Math.ceil(product.rating);
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }

        // Generate Badge Output conditionally
        const badgeHtml = product.badge ? `<div class="card-badge">${product.badge}</div>` : '';

        return `
        <div class="modern-card">
            <div class="modern-card-image-wrap">
                ${badgeHtml}
                <button class="wishlist-btn" onclick="toggleWishlist(this, event)">
                    <i class="far fa-heart"></i>
                </button>
                <img src="${product.image}" loading="lazy" alt="${product.name}">
                <button class="quick-add-btn" onclick="cartAction('${product.id}', this)">
                    Quick Add <i class="fas fa-plus" style="margin-left: 5px; font-size: 0.8rem;"></i>
                </button>
            </div>
            <div class="modern-card-info">
                <h3 class="modern-card-title">${product.name}</h3>
                <div class="modern-card-price">$${product.price.toFixed(2)}</div>
                <div class="modern-card-rating">
                    ${starsHtml}
                    <span style="color: #999; margin-left: 4px;">(${product.reviews})</span>
                </div>
            </div>
        </div>
    `}).join('');
}

// Visual Add to Wishlist Toggle
window.toggleWishlist = function (button, event) {
    event.stopPropagation();
    const icon = button.querySelector('i');

    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        icon.style.color = '#e11d48'; // Filled Red Heart
    } else {
        icon.classList.add('far');
        icon.classList.remove('fas');
        icon.style.color = '#333'; // Empty Dark Heart
    }

    // Tiny bounce effect on the icon
    icon.style.animation = 'pulse 0.3s ease';
    setTimeout(() => icon.style.animation = '', 300);
}

// Global Cart Function Mapping
window.cartAction = function (productId, button) {
    // Prevent double clicking
    if (button.disabled) return;

    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    button.disabled = true;

    setTimeout(() => {
        showProductsNotification('Product added to bag successfully!', 'success');

        button.innerHTML = 'Added <i class="fas fa-check" style="margin-left:5px"></i>';
        button.style.background = '#111';
        button.style.color = '#fff';

        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 3000);
    }, 800);
};

// Standalone notification renderer
function showProductsNotification(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
