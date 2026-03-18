# 🎂 Tempted Desserts — Full Stack Bakery Website

A complete, production-ready bakery website with:
- **Customer-facing storefront** — Menu, order form, story, contact
- **Admin panel** — Add/edit/delete menu items with photo uploads
- **Orders dashboard** — View and manage all customer orders
- **Node.js + Express backend** — REST API
- **SQLite database** — Lightweight, zero-config database
- **JWT authentication** — Secure admin login
- **File uploads** — Photos stored on server via Multer

---

## 📁 Project Structure

```
tempted-bakery/
├── backend/
│   ├── server.js          ← Main Express server
│   ├── db.js              ← SQLite database setup
│   ├── .env               ← Environment variables (passwords, secrets)
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js        ← JWT auth middleware
│   ├── routes/
│   │   ├── auth.js        ← POST /api/auth/login
│   │   ├── menu.js        ← GET/POST/PUT/DELETE /api/menu
│   │   └── orders.js      ← GET/POST/PUT/DELETE /api/orders
│   ├── data/
│   │   └── tempted.db     ← SQLite database (auto-created)
│   └── uploads/           ← Uploaded menu photos (auto-created)
│
├── frontend/
│   └── public/
│       ├── index.html     ← Main website (customer + admin)
│       ├── css/
│       │   └── styles.css ← All styles
│       └── js/
│           └── app.js     ← All frontend logic + API calls
│
├── render.yaml            ← Render.com deployment config
├── package.json           ← Root scripts
└── README.md              ← This file
```

---

## 🚀 Option 1: Run Locally (on your computer)

### Requirements
- **Node.js** (version 18 or higher) — download from https://nodejs.org

### Steps

```bash
# 1. Open terminal/command prompt in the project folder
cd tempted-bakery

# 2. Install dependencies
cd backend
npm install

# 3. Start the server
npm start

# 4. Open your browser and visit:
#    http://localhost:5000
```

Your website is now running at **http://localhost:5000** 🎂

---

## 🌐 Option 2: Deploy FREE Online (Render.com) — Recommended

Render gives you a **free hosted URL** that works on any device, anywhere.

### Step 1 — Upload your code to GitHub (free)
1. Go to https://github.com and create a free account
2. Click **"New repository"** → name it `tempted-bakery` → click Create
3. On your computer, install **GitHub Desktop** from https://desktop.github.com
4. Open GitHub Desktop → **File → Add Local Repository** → select your `tempted-bakery` folder
5. Click **"Publish repository"** → it uploads to GitHub

### Step 2 — Deploy on Render
1. Go to https://render.com and sign up (free)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select `tempted-bakery`
4. Render will automatically detect `render.yaml` and configure everything
5. Click **"Create Web Service"**
6. Wait 3-5 minutes → you get a URL like `https://tempted-bakery.onrender.com`

**Done!** Share that URL with customers. 🎉

### Step 3 — Set up persistent disk (for photos)
On the free plan, uploaded photos may reset. To keep them permanently:
1. In Render dashboard → your service → **"Disks"**
2. Add a disk at `/opt/render/project/src/uploads` with 1GB
3. Photos will now persist forever

---

## 🔐 Admin Panel

Visit your website and click **"Admin"** in the top navigation.

**Default password:** `tempted2024`

### To change your password:
1. Open `backend/.env` in any text editor
2. Change `ADMIN_PASSWORD=tempted2024` to your new password
3. Restart the server (or redeploy on Render)

---

## 📋 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Admin login → returns JWT token |
| GET  | `/api/auth/verify` | ✅ | Verify token is valid |
| GET  | `/api/menu` | ❌ | Get all visible menu items |
| GET  | `/api/menu?category=Cakes` | ❌ | Filter by category |
| GET  | `/api/menu/categories` | ❌ | Get all categories |
| GET  | `/api/menu/all` | ✅ | Admin: all items including hidden |
| POST | `/api/menu` | ✅ | Add new menu item (with photo) |
| PUT  | `/api/menu/:id` | ✅ | Update menu item |
| DELETE | `/api/menu/:id` | ✅ | Delete menu item |
| DELETE | `/api/menu/:id/photo` | ✅ | Remove item photo |
| POST | `/api/orders` | ❌ | Place a customer order |
| GET  | `/api/orders` | ✅ | Admin: get all orders |
| PUT  | `/api/orders/:id/status` | ✅ | Update order status |
| DELETE | `/api/orders/:id` | ✅ | Delete an order |
| GET  | `/api/health` | ❌ | Server health check |

---

## ⚙️ Environment Variables (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `ADMIN_PASSWORD` | `tempted2024` | Admin login password |
| `JWT_SECRET` | (set a strong secret) | Token signing secret |
| `NODE_ENV` | `development` | Environment mode |

---

## 📞 Contact Details (to change)

Open `frontend/public/index.html` and search for:
- `7585820245` — your phone/WhatsApp number
- `ghoshmohona8@gmail.com` — your email

---

## 📸 Photo Tips

- Best size: 800×600px or 1:1 square
- Formats: JPG, PNG, WEBP
- Max size: 8MB per photo
- Natural lighting makes food photos look amazing!

---

*Built with ♡ for Tempted Desserts*
