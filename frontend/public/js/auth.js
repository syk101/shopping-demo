/**
 * Initialize Social Logins
 */
function initSocialLogins() {
    console.log('[DEBUG] Current Origin:', window.location.origin);

    if (typeof google !== 'undefined' && typeof CONFIG !== 'undefined') {
        if (CONFIG.GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')) {
            console.error('CRITICAL: Google Client ID is not configured in js/config.js');
            return;
        }

        google.accounts.id.initialize({
            client_id: CONFIG.GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            context: 'signin',
            ux_mode: 'popup',
            auto_select: false
        });

        const signinButton = document.querySelector('.g_id_signin');
        if (signinButton) {
            google.accounts.id.renderButton(signinButton, {
                type: 'standard',
                shape: 'rectangular',
                theme: 'outline',
                text: 'signin_with',
                size: 'large',
                logo_alignment: 'left'
            });
        }
    }

    // Initialize Facebook SDK
    if (typeof FB !== 'undefined' && typeof CONFIG !== 'undefined') {
        window.fbAsyncInit = function () {
            FB.init({
                appId: CONFIG.FACEBOOK_APP_ID,
                cookie: true,
                xfbml: true,
                version: 'v18.0'
            });
        };
    }
}

document.addEventListener('DOMContentLoaded', initSocialLogins);

/**
 * Handles the Google Sign-In credential response
 * @param {Object} response - The response object from Google Identity Services
 */
function handleCredentialResponse(response) {
    try {
        // Decode the JWT token
        const responsePayload = decodeJwtResponse(response.credential);

        console.log("ID: " + responsePayload.sub);
        console.log('Full Name: ' + responsePayload.name);
        console.log('Given Name: ' + responsePayload.given_name);
        console.log('Family Name: ' + responsePayload.family_name);
        console.log("Image URL: " + responsePayload.picture);
        console.log("Email: " + responsePayload.email);

        // Store user info in localStorage
        const user = {
            id: responsePayload.sub,
            name: responsePayload.name,
            given_name: responsePayload.given_name,
            email: responsePayload.email,
            picture: responsePayload.picture
        };

        localStorage.setItem('shopUser', JSON.stringify(user));

        // Redirect to shop page
        window.location.href = 'shop.html';
    } catch (error) {
        console.error('Error handling credential response:', error);
        alert('Failed to sign in. Please try again.');
    }
}

/**
 * Handles the Demo Login for testing purposes
 */
function handleDemoLogin() {
    const demoUser = {
        id: "demo-user-123",
        name: "Demo User",
        email: "demo@example.com",
        picture: "https://ui-avatars.com/api/?name=Demo+User&background=random"
    };

    localStorage.setItem('shopUser', JSON.stringify(demoUser));
    window.location.href = 'shop.html';
}

/**
 * Handles the Facebook Login
 */
function handleFacebookLogin() {
    if (typeof FB === 'undefined') {
        alert('Facebook SDK not loaded yet. Please try again in a moment.');
        return;
    }

    FB.login(function (response) {
        if (response.authResponse) {
            console.log('Welcome!  Fetching your information.... ');
            FB.api('/me', { fields: 'name,email,picture' }, function (response) {
                console.log('Good to see you, ' + response.name + '.');

                const user = {
                    id: response.id,
                    name: response.name,
                    email: response.email || 'N/A',
                    picture: response.picture?.data?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(response.name)}&background=1877F2&color=fff`
                };

                localStorage.setItem('shopUser', JSON.stringify(user));
                window.location.href = 'shop.html';
            });
        } else {
            console.log('User cancelled login or did not fully authorize.');
        }
    }, { scope: 'public_profile,email' });
}

/**
 * Decodes the JWT token returned by Google
 * @param {string} token - The JWT token
 * @returns {Object} - The decoded payload
 */
function decodeJwtResponse(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

/**
 * Checks if user is logged in and updates UI
 */
function checkAuthState() {
    const userStr = localStorage.getItem('shopUser');
    const navLinks = document.querySelector('.nav-links');

    if (!navLinks) return; // Guard clause if script runs on page without nav

    if (userStr) {
        const user = JSON.parse(userStr);

        // Remove existing login link if present
        const loginLink = document.querySelector('.login-link');
        if (loginLink) loginLink.remove();

        // Check if user profile is already added to avoid duplicates
        if (!document.querySelector('.user-profile-nav')) {
            const userHtml = `
                <div class="user-profile-nav">
                    <img src="${user.picture}" alt="${user.name}" class="nav-user-img">
                    <span class="nav-user-name">${user.given_name || user.name.split(' ')[0]}</span>
                    <button onclick="logout()" class="logout-btn" title="Logout">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            `;
            navLinks.insertAdjacentHTML('beforeend', userHtml);
        }
    } else {
        // Ensure Login link exists if not logged in
        if (!document.querySelector('.login-link')) {
            const loginHtml = `
                <a href="login.html" class="nav-link login-link">
                    <i class="fas fa-user"></i> Login
                </a>
            `;
            navLinks.insertAdjacentHTML('beforeend', loginHtml);
        }
    }
}

/**
 * Logs out the user
 */
function logout() {
    localStorage.removeItem('shopUser');
    window.location.reload();
}

// Run check on page load
document.addEventListener('DOMContentLoaded', checkAuthState);
