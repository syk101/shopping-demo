# How to Deploy to Render

Follow these steps to get your Shopping Management System live with a working backend!

## 1. Create a Render Account
Go to [Render.com](https://render.com/) and sign up with your GitHub account.

## 2. Create a New Web Service
1. Click **New +** and select **Web Service**.
2. Connect your GitHub repository: `syk101/shopping-demo`.
3. Render should automatically detect your `render.yaml` file.

## 3. Deployment Settings
If it asks for settings manually:
- **Runtime**: Node
- **Build Command**: `npm install`
- **Start Command**: `npm start`

## 4. Important Note: Database
This project uses **SQLite**, which stores data in a local file (`database/shop.db`).
> [!WARNING]
> Render's **Free Tier** has ephemeral storage. This means every time the server restarts or goes to sleep, any **new** data you added (new orders, new employees) will be deleted and reset to the default state.

To keep data permanently on Render, you would normally need their "Starter" plan with a "Persistent Disk," but for a class project, the Free Tier is usually enough for a demo!

## 5. Verify the Link
Once deployed, Render will give you a URL like `https://shopping-management-system.onrender.com`. Open it, and your Dashboard graphs will now work live!
