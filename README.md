# 🧩 Puzzle Grove

**Puzzle Grove** is a full-stack, interactive web application that brings the classic joy of jigsaw puzzles into the browser. Built with a modern MERN stack, this platform allows users to relax with built-in, beautifully curated puzzles or challenge themselves by uploading their own custom images.
<img width="1878" height="907" alt="image" src="https://github.com/user-attachments/assets/c53e585b-979b-4dc1-9d9b-965af652c049" />


This repository serves multiple audiences. Please use the table of contents below to navigate to the section most relevant to you.
---

## 📑 Table of Contents
1. [🕹️ The Player's Manual (For Users)](#1-the-players-manual)
2. [💼 The Portfolio Showcase (For Recruiters)](#2-the-portfolio-showcase)
3. [🎓 Academic & Evaluator Submission (For Judges)](#3-academic--evaluator-submission)
4. [🚀 Local Development & Setup](#4-local-development--setup)

---

## 1. 🕹️ The Player's Manual
*Welcome to Puzzle Grove! Here is how to jump in and start playing.*

### How to Play
* **Select a Difficulty:** Before starting, use the toggle on the home screen to choose your grid size: **4x4 (Easy)**, **5x5 (Medium)**, or **6x6 (Hard)**.
* **Drag and Drop:** Click (or tap on mobile) and drag puzzle pieces to the center board.
* **Snap to Grid:** When you release a piece close to its correct position, the magnetic grid will automatically snap it into place and lock it.
* **Hold to Preview:** Stuck? Press and hold the "👁 Hold to Preview" button at the top of the screen to see the completed image. Let go, and the preview instantly fades away.

### Custom Puzzles
You aren't limited to the built-in demo puzzles!
* Click **"Upload Custom Image"** and choose any photo from your device.
* The game will instantly chop your photo into a playable puzzle based on your selected difficulty.
* When you successfully lock all pieces, enjoy the confetti! 🎉

---

## 2. 💼 The Portfolio Showcase
*A high-level overview of the engineering decisions, performance optimizations, and architecture.*

### ⚡ Custom Physics & Animation Engine
The standout feature of this frontend is the custom drag-and-drop physics engine. Standard React state updates (`setState`) triggered by `onMouseMove` events cause fatal memory leaks and re-render loops (over 60 renders per second). 
* **The Solution:** The drag mechanics were decoupled from React's render cycle using `requestAnimationFrame`. This syncs piece movement directly with the monitor's refresh rate, resulting in a lightweight, stutter-free experience that never crashes the browser, even on mobile devices.

### 🧠 Optimistic UI & Memory Management
* **Instant Gameplay:** When a user uploads a file, the frontend uses `URL.createObjectURL()` to instantly load the image into the browser's memory, bypassing slow Base64 conversions. The game starts in milliseconds.
* **Silent Background Sync:** While the user plays, the frontend silently executes a `fetch` request to upload the image to the Node.js backend. If the backend is asleep or offline, the request fails silently via a `catch` block, ensuring the user's game is never interrupted.

### 🧹 Automated Resource Management
To maintain a completely free cloud hosting footprint, the backend implements a Node `cron` job. Every hour, the server sweeps the database and the local file system, automatically deleting any puzzle document and physical image file older than 24 hours.

---

## 3. 🎓 Academic & Evaluator Submission
*Technical specifications, routing, and stack details.*

### Tech Stack Breakdown
* **Frontend:** React.js, Vite
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas, Mongoose ODM
* **File Handling:** Multer (multipart/form-data)
* **Deployment:** Vercel (Frontend), Render (Backend)

### Server-Side Architecture
The Node/Express backend is designed as a RESTful API specifically optimized for file handling.
* **`POST /api/upload`:** Utilizes `multer.diskStorage` to intercept incoming images, validates file types and sizes (10MB limit), dynamically generates a unique timestamped filename, saves the file locally to `/uploads`, and persists the metadata URL to MongoDB.
* **Static Serving:** Express is configured to serve the `/uploads` directory statically, allowing the frontend to retrieve dynamically generated images via standard URLs.
* **Schema Design:** The Mongoose `Puzzle` schema stores the `imageUrl`, an enum-validated `difficulty` (4, 5, or 6), and an auto-generated `createdAt` timestamp (utilized by the automated Cron cleanup job).

---

## 4. 🚀 Local Development & Setup

To run Puzzle Grove locally, you will need Node.js and a MongoDB connection (Local Community Server or Atlas).

### Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file
# Add: PORT=5000
# Add: MONGO_URI="your_mongodb_connection_string"
# Add: CLIENT_ORIGIN="http://localhost:5173"

# 4. Start the server
npm run dev
```

### Frontend Setup
```bash
# 1. Navigate to frontend directory in a new terminal
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env file
# Add: VITE_API_URL="http://localhost:5000"

# 4. Start the Vite server
npm run dev
```
