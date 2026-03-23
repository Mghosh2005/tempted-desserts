# 🎂 Tempted Desserts — Full Stack Bakery Website

## Stack
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas (free, permanent cloud storage)
- **Photos:** Cloudinary (free, permanent image storage)
- **Frontend:** HTML + CSS + Vanilla JS
- **Deploy:** Render.com (free)

---

## 🔧 Setup: 3 Free Services You Need

### 1. MongoDB Atlas (Database)
1. Go to https://mongodb.com/atlas
2. Sign up free → Create a project → Create a cluster (free M0)
3. Click **Connect** → **Drivers** → copy the connection string
4. Looks like: `mongodb+srv://user:password@cluster.mongodb.net/tempted`

### 2. Cloudinary (Photo Storage)
1. Go to https://cloudinary.com → Sign up free
2. Go to Dashboard → copy these 3 values:
   - Cloud Name
   - API Key
   - API Secret

### 3. Render.com (Hosting)
- Your website host (already set up)

---

## 🚀 Run Locally

```bash
cd backend
npm install
npm start
```

Make sure your `.env` file has all values filled in.

---

## ⚙️ Environment Variables

Set these in Render dashboard → Environment:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | your MongoDB Atlas connection string |
| `CLOUDINARY_CLOUD_NAME` | from Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | from Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | from Cloudinary dashboard |
| `ADMIN_PASSWORD` | tempted2024 |
| `JWT_SECRET` | any random long string |
| `NODE_ENV` | production |

---

## 📁 Project Structure

```
tempted-full/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── .env
│   ├── middleware/auth.js
│   ├── models/
│   │   ├── MenuItem.js
│   │   └── Order.js
│   └── routes/
│       ├── auth.js
│       ├── menu.js
│       └── orders.js
└── frontend/
    └── public/
        ├── index.html
        ├── css/styles.css
        └── js/app.js
```
