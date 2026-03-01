// Collections Page JavaScript

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    initializeCollectionsPage();
    setupSmoothScrolling();
    setupIntersectionObserver();
    setupHamburgerMenu();
});

// Initialize collections page functionality
function initializeCollectionsPage() {
    // Add scroll event listener for navbar effect
    window.addEventListener('scroll', handleScroll);
    
    // Add animation to collection sections when they come into view
    animateOnScroll();
    
    // Set up parallax effect for hero section
    setupParallaxEffect();
}

// Handle scroll events for navbar
function handleScroll() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(15, 23, 42, 0.98)';
        navbar.style.backdropFilter = 'blur(25px)';
    } else {
        navbar.style.background = 'rgba(15, 23, 42, 0.95)';
        navbar.style.backdropFilter = 'blur(20px)';
    }
}

// Set up smooth scrolling for navigation links
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
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

// Set up intersection observer for animations
function setupIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe collection sections
    document.querySelectorAll('.collection-section').forEach(section => {
        observer.observe(section);
    });
}

// Animate elements on scroll
function animateOnScroll() {
    const collectionSections = document.querySelectorAll('.collection-section');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    collectionSections.forEach((section, index) => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(50px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        section.style.transitionDelay = `${index * 0.2}s`;
        observer.observe(section);
    });
}

// Set up parallax effect for hero section
function setupParallaxEffect() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        const hero = document.querySelector('.hero');
        
        if (hero) {
            hero.style.transform = `translateY(${rate}px)`;
        }
    });
}

// View collection function
function viewCollection(collectionType) {
    // Show loading state
    const button = event.target.closest('.cta-button');
    const originalText = button.innerHTML;
    button.innerHTML = 'Loading... <i class="fas fa-spinner fa-spin"></i>';
    button.disabled = true;

    // Simulate API call or navigation
    setTimeout(() => {
        // In a real app, this would navigate to the specific collection page
        alert(`Navigating to ${collectionType.charAt(0).toUpperCase() + collectionType.slice(1)} Collection`);
        
        // Restore button
        button.innerHTML = originalText;
        button.disabled = false;
        
        // Show notification
        showNotification(`${collectionType.charAt(0).toUpperCase() + collectionType.slice(1)} collection page loading...`, 'success');
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
    
    // Add styles
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
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Set up hamburger menu for mobile
function setupHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// Add hamburger menu animation
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            const bars = hamburger.querySelectorAll('.bar');
            
            bars.forEach(bar => {
                bar.classList.toggle('active');
            });
        });
    }
});

// Add active class to hamburger bars
function toggleHamburgerAnimation() {
    const bars = document.querySelectorAll('.hamburger .bar');
    
    bars.forEach((bar, index) => {
        if (bar.classList.contains('active')) {
            bar.style.transform = 'rotate(45deg) translate(5px, 5px)';
        } else {
            bar.style.transform = 'none';
        }
        
        if (index === 1) {
            if (bar.classList.contains('active')) {
                bar.style.opacity = '0';
            } else {
                bar.style.opacity = '1';
            }
        }
        
        if (index === 2) {
            if (bar.classList.contains('active')) {
                bar.style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                bar.style.transform = 'none';
            }
        }
    });
}

// Enhanced scroll indicator animation
function setupScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    if (scrollIndicator) {
        // Add smooth animation to scroll indicator
        let isAnimating = false;
        
        function animateScrollIndicator() {
            if (isAnimating) return;
            
            isAnimating = true;
            scrollIndicator.style.transform = 'translateX(-50%) translateY(-20px)';
            
            setTimeout(() => {
                scrollIndicator.style.transform = 'translateX(-50%) translateY(0)';
                isAnimating = false;
            }, 400);
        }
        
        // Start animation loop
        setInterval(animateScrollIndicator, 2000);
    }
}

// Initialize scroll indicator animation
document.addEventListener('DOMContentLoaded', setupScrollIndicator);

// Add dynamic video background control
function setupVideoControls() {
    const video = document.getElementById('collection-video');
    
    if (video) {
        // Pause video when user scrolls to reduce performance impact
        let scrollTimer;
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            video.pause();
            
            scrollTimer = setTimeout(() => {
                video.play();
            }, 1000);
        });
    }
}

// Initialize video controls
document.addEventListener('DOMContentLoaded', setupVideoControls);