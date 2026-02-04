// User Panel JavaScript

// Initialize the user panel
document.addEventListener('DOMContentLoaded', function() {
    initializeUserPanel();
    setupSmoothScrolling();
    setupCollectionAnimations();
});

// Initialize user panel functionality
function initializeUserPanel() {
    // Add scroll event listener for header effect
    window.addEventListener('scroll', handleHeaderScroll);
    
    // Set up intersection observers for animations
    setupIntersectionObservers();
    
    // Add loading animations
    addLoadingAnimations();
}

// Handle header scroll effect
function handleHeaderScroll() {
    const header = document.querySelector('.user-header');
    if (window.scrollY > 50) {
        header.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
        header.style.background = 'linear-gradient(135deg, #1e40af, #7c3aed)';
    } else {
        header.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
        header.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
    }
}

// Set up smooth scrolling for navigation
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-item[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
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

// Set up intersection observers for animations
function setupIntersectionObservers() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    // Observer for collection sections
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all collection sections
    document.querySelectorAll('.collection-section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        sectionObserver.observe(section);
    });

    // Observer for product cards
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

    // Observe product cards
    document.querySelectorAll('.product-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        productObserver.observe(card);
    });
}

// Add loading animations
function addLoadingAnimations() {
    // Add fade-in animation to header
    const header = document.querySelector('.user-header');
    header.style.opacity = '0';
    header.style.transform = 'translateY(-20px)';
    header.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    
    setTimeout(() => {
        header.style.opacity = '1';
        header.style.transform = 'translateY(0)';
    }, 300);

    // Add staggered animation to navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
        setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, 500 + (index * 100));
    });
}

// Explore collection function
function exploreCollection(collectionType) {
    // Get the button that was clicked
    const button = event.target.closest('.explore-btn');
    const originalText = button.innerHTML;
    
    // Show loading state
    button.innerHTML = 'Loading... <i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;
    
    // Simulate API call or navigation
    setTimeout(() => {
        // In a real application, this would navigate to the specific collection
        showNotification(`Exploring ${collectionType.charAt(0).toUpperCase() + collectionType.slice(1)} Collection`, 'success');
        
        // Restore button
        button.innerHTML = originalText;
        button.disabled = false;
        
        // Scroll to featured products section
        document.querySelector('.featured-products').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 1500);
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
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add hover effects to collection sections
function setupCollectionAnimations() {
    const collectionSections = document.querySelectorAll('.collection-section');
    
    collectionSections.forEach(section => {
        section.addEventListener('mouseenter', function() {
            const imagePlaceholder = this.querySelector('.image-placeholder');
            if (imagePlaceholder) {
                imagePlaceholder.style.transform = 'scale(1.05)';
            }
        });
        
        section.addEventListener('mouseleave', function() {
            const imagePlaceholder = this.querySelector('.image-placeholder');
            if (imagePlaceholder) {
                imagePlaceholder.style.transform = 'scale(1)';
            }
        });
    });
}

// Add parallax effect to hero section
function setupParallaxEffect() {
    const heroSection = document.querySelector('.hero-section');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.5;
        
        if (heroSection) {
            heroSection.style.backgroundPosition = `center ${rate}px`;
        }
    });
}

// Initialize parallax effect
document.addEventListener('DOMContentLoaded', setupParallaxEffect);

// Add click effects to product cards
function setupProductCardEffects() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        card.addEventListener('click', function() {
            // Add pulse animation
            this.style.animation = 'pulse 0.3s ease';
            
            setTimeout(() => {
                this.style.animation = '';
            }, 300);
            
            // Show product details (in a real app)
            showNotification('Product details would appear here', 'info');
        });
    });
}

// Add pulse animation CSS
function addPulseAnimation() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
}

// Initialize product card effects
document.addEventListener('DOMContentLoaded', function() {
    addPulseAnimation();
    setupProductCardEffects();
});

// Add keyboard navigation support
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Skip if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        switch(e.key) {
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
        }
        .skip-link:focus {
            top: 6px;
        }
    `;
    document.head.appendChild(style);
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add main content landmark
    const mainContent = document.querySelector('.hero-section');
    if (mainContent) {
        mainContent.setAttribute('id', 'main-content');
        mainContent.setAttribute('role', 'main');
    }
}

// Initialize accessibility features
document.addEventListener('DOMContentLoaded', setupAccessibility);