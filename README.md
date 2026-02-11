# Premium Shopping Management System

A modern, responsive shopping website featuring a premium design, video lookbooks, and Google Sign-In integration.

## Features
- **Premium UI**: Video backgrounds, glassmorphism effects, and smooth animations.
- **Google Sign-In**: Professional authentication integration (Client-side demo included).
- **Responsive Design**: Mobile-friendly navigation and layout.

## Social Login Setup

To make Google and Facebook login workable for your hosted site, follow these steps:

### 1. Google Cloud Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Search for **APIs & Services** > **Credentials**.
4. Create an **OAuth 2.0 Client ID** (Web Application).
5. Add your hosted URL (e.g., `https://yourdomain.com`) to **Authorized JavaScript Origins**.
6. Copy the **Client ID** and paste it into `frontend/public/js/config.js`.

### 2. Facebook Developer Setup
1. Go to the [Facebook Developers Portal](https://developers.facebook.com/).
2. Create a new app.
3. Add **Facebook Login** product to your app.
4. Go to **Settings** > **Basic** to find your **App ID**.
5. Add your hosted URL to the **App Domains**.
6. Copy the **App ID** and paste it into `frontend/public/js/config.js`.

## Hosting
This project is designed to be hosted on platforms like GitHub Pages, Vercel, or Netlify.
- Home: `index.html`
- Shop: `shop.html`
- Login: `login.html`
