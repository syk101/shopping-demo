// Standalone Shop Page JavaScript

// Initialize the shop page
document.addEventListener('DOMContentLoaded', function () {
    initializeShop();
    setupNavigation();
    setupSmoothScrolling();
    setupAnimations();
    setupVideoHandling();
});

// Initialize shop functionality
function initializeShop() {
    // Set up mobile menu
    setupMobileMenu();

    // Set up form handling
    setupContactForm();

    // Set up scroll effects
    setupScrollEffects();

    // Load dynamic featured products
    loadFeaturedProducts();
}

async function loadFeaturedProducts() {
    try {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const allProducts = await response.json();

        // Take first 3 as featured (one from each main category if possible, or just first 3)
        const featured = allProducts.slice(0, 3);

        renderProductGrid('featured-grid', featured);
    } catch (error) {
        console.error('Error loading featured products:', error);
    }
}



function renderProductGrid(gridId, products) {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = '<div class="empty-state">No products found</div>';
        return;
    }

    grid.innerHTML = products.map(product => {
        const imageUrl = product.image || 'https://via.placeholder.com/300';
        const rating = product.rating || 4.5;
        const reviews = product.sales_count || Math.floor(Math.random() * 100) + 20;

        // Stars calculation
        let starsHtml = '';
        const fullStars = Math.floor(rating);
        for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star"></i>';
        if (rating % 1 !== 0) starsHtml += '<i class="fas fa-star-half-alt"></i>';
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) starsHtml += '<i class="far fa-star"></i>';

        return `
        <div class="product-card">
            <div class="product-image">
                <img src="${imageUrl}" alt="${product.name}" loading="lazy">
                ${product.stock_quantity <= 5 && product.stock_quantity > 0 ? '<div class="product-badge">LOW STOCK</div>' : ''}
                ${product.stock_quantity === 0 ? '<div class="product-badge sale">OUT OF STOCK</div>' : ''}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description || 'Premium quality apparel crafted for comfort and style.'}</p>
                <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                <div class="product-rating">
                    ${starsHtml}
                    <span>(${reviews})</span>
                </div>
                <button class="btn btn-primary btn-small" onclick="addToCart(${product.id})">
                    ADD TO CART
                </button>
            </div>
        </div>
    `}).join('');
}

// Set up mobile menu
function setupMobileMenu() {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', function () {
            navLinks.classList.toggle('active');
            const icon = this.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking on links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = mobileBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }
}

// Set up navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    // Set active link based on scroll position
    window.addEventListener('scroll', function () {
        let current = '';

        document.querySelectorAll('section').forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Set up smooth scrolling
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Set up scroll effects
function setupScrollEffects() {
    // Header scroll effect
    const header = document.querySelector('.main-nav');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        }
    });

    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', function () {
            const scrollPosition = window.pageYOffset;
            hero.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
        });
    }
}

// Set up animations
function setupAnimations() {
    // Fade in animations for sections
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe collection sections
    document.querySelectorAll('.collection-section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        sectionObserver.observe(section);
    });

    // Observe product cards
    const productObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 200);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.product-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        productObserver.observe(card);
    });
}

// View products function
function viewProducts(collection, category) {
    // Show loading state
    const button = event.target;
    // Capture innerHTML so we can restore whatever icon/text was inside
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    button.disabled = true;

    // Redirect to dynamic products page with URL parameters
    setTimeout(() => {
        window.location.href = `products.html?category=${category}&collection=${collection}`;

        // Reset button state slightly after executing the redirect
        // This ensures if the user hits the browser "Back" button (restoring from bfcache),
        // the button will not be stuck on "Loading..."
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.disabled = false;
        }, 100);
    }, 500);
}

// Add to cart function
function addToCart(productId) {
    const button = event.target;
    const originalText = button.textContent;

    // Show loading state
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    button.disabled = true;

    // Simulate API call
    setTimeout(() => {
        showNotification('Product added to cart successfully!', 'success');
        button.textContent = originalText;
        button.disabled = false;

        // Add animation effect
        button.style.animation = 'pulse 0.3s ease';
        setTimeout(() => {
            button.style.animation = '';
        }, 300);
    }, 1000);
}

// Set up product interactions
function setupProductInteractions() {
    // Add hover effects to collection items
    document.querySelectorAll('.collection-item').forEach(item => {
        item.addEventListener('mouseenter', function () {
            const image = this.querySelector('.item-image');
            if (image) {
                image.style.transform = 'scale(1.05)';
            }
        });

        item.addEventListener('mouseleave', function () {
            const image = this.querySelector('.item-image');
            if (image) {
                image.style.transform = 'scale(1)';
            }
        });
    });

    // Add click effects to product cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function (e) {
            // Don't trigger if clicking on buttons
            if (e.target.closest('button')) return;

            // Add pulse animation
            this.style.animation = 'pulse 0.3s ease';
            setTimeout(() => {
                this.style.animation = '';
            }, 300);

            showNotification('Product details would appear in a modal', 'info');
        });
    });
}

// Set up contact form
function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            // Show loading state
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;

            // Simulate form submission
            setTimeout(() => {
                showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
                form.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
}

// Show notification function
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

    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        @media (max-width: 768px) {
            .notification {
                right: 10px;
                left: 10px;
                top: 80px;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add keyboard navigation support
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function (e) {
        // Skip if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case '1':
                document.querySelector('#mens').scrollIntoView({ behavior: 'smooth' });
                break;
            case '2':
                document.querySelector('#womens').scrollIntoView({ behavior: 'smooth' });
                break;
            case '3':
                document.querySelector('#kids').scrollIntoView({ behavior: 'smooth' });
                break;
            case 'ArrowUp':
                window.scrollBy({ top: -100, behavior: 'smooth' });
                break;
            case 'ArrowDown':
                window.scrollBy({ top: 100, behavior: 'smooth' });
                break;
        }
    });
}

// Initialize keyboard navigation
document.addEventListener('DOMContentLoaded', setupKeyboardNavigation);

// Add accessibility improvements
function setupAccessibility() {
    // Add skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';

    const style = document.createElement('style');
    style.textContent = `
        .skip-link {
            position: absolute;
            top: -40px;
            left: 6px;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 1000;
            border-radius: 4px;
        }
        .skip-link:focus {
            top: 6px;
        }
    `;
    document.head.appendChild(style);

    document.body.insertBefore(skipLink, document.body.firstChild);

    // Add main content landmark
    const mainContent = document.querySelector('.hero');
    if (mainContent) {
        mainContent.setAttribute('id', 'main-content');
        mainContent.setAttribute('role', 'main');
    }
}

// Initialize accessibility features
document.addEventListener('DOMContentLoaded', setupAccessibility);

// Add loading animations
function addLoadingAnimations() {
    // Add fade-in to header
    const header = document.querySelector('.main-nav');
    if (header) {
        header.style.opacity = '0';
        header.style.transform = 'translateY(-20px)';
        header.style.transition = 'opacity 0.8s ease, transform 0.8s ease';

        setTimeout(() => {
            header.style.opacity = '1';
            header.style.transform = 'translateY(0)';
        }, 300);
    }

    // Add staggered animation to nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach((link, index) => {
        link.style.opacity = '0';
        link.style.transform = 'translateY(-10px)';
        link.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

        setTimeout(() => {
            link.style.opacity = '1';
            link.style.transform = 'translateY(0)';
        }, 600 + (index * 100));
    });
}

// Initialize loading animations
document.addEventListener('DOMContentLoaded', addLoadingAnimations);

// Set up video handling
// Set up video handling
function setupVideoHandling() {
    // Handle video loading
    const videos = document.querySelectorAll('video');

    videos.forEach(video => {
        // Ensure video is visible and clean
        video.style.opacity = '1';
        video.style.filter = 'none';

        // Force play
        video.play().catch(e => {
            console.log('Auto-play failed:', e);
            // Try muted play if failed
            video.muted = true;
            video.play().catch(e => console.log('Muted play failed:', e));
        });

        // Add event listeners to ensure visibility when loaded
        video.addEventListener('loadeddata', function () {
            this.style.opacity = '1';
            this.style.filter = 'none';
        });

        // Handle errors gracefully but keep container visible
        video.addEventListener('error', function (e) {
            console.log('Video failed to load:', e.target.currentSrc);
            // Even on error, we don't want to hide the container if possible, 
            // but usually we'd show a fallback. For now, just ensure opacity is 1
            // so if there's a poster or background it shows.
            this.style.opacity = '1';
        });

        // Pause videos when not in viewport to save resources
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    video.play().catch(e => console.log('Video play failed:', e));
                } else {
                    video.pause();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(video);
    });

    // Handle hero video specifically
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo) {
        // Ensure hero video is also clean
        heroVideo.style.opacity = '1';
        heroVideo.style.filter = 'none';

        window.addEventListener('scroll', function () {
            const scrollPosition = window.pageYOffset;
            const slowScroll = scrollPosition * 0.15;
            heroVideo.style.transform = `translate(-50%, -50%) scale(1.08) translateY(${slowScroll}px)`;
        });
    }
}


// Add video quality controls
function setupVideoQuality() {
    const videos = document.querySelectorAll('video');

    // Reduce quality on mobile devices
    if (window.innerWidth < 768) {
        videos.forEach(video => {
            video.setAttribute('preload', 'metadata');
        });
    }

    // Handle video performance
    let videoPerformanceTimer;
    window.addEventListener('scroll', function () {
        clearTimeout(videoPerformanceTimer);
        videoPerformanceTimer = setTimeout(() => {
            videos.forEach(video => {
                if (video.paused) {
                    video.load(); // Reload if paused for too long
                }
            });
        }, 5000);
    });
}

document.addEventListener('DOMContentLoaded', setupVideoQuality);