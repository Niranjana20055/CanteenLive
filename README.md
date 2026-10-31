# CanteenLive: Real-Time Canteen Queue Tracker & Load Balancing System

[![Deployment Status](https://img.shields.io/badge/Deployment-Live%20on%20GitHub%20Pages-brightgreen)](https://niranjana20055.github.io/CanteenLive/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20v7.0-47a248.svg)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Cache-Redis%20v7.0%20Pub%2FSub-dc382d.svg)](https://redis.io/)
[![License](https://img.shields.io/badge/Course-BCSE406L%20Database%20Systems-blue.svg)](https://vit.ac.in)

> **Live Production URL for Professor Review:**  
> 🔗 **[https://niranjana20055.github.io/CanteenLive/](https://niranjana20055.github.io/CanteenLive/)**  
> *(Runs completely in any browser with instant one-click demo personas and real-time multi-tab synchronization)*

---

## 🎓 Academic Project Information
* **Course:** BCSE406L — Database Systems Laboratory
* **Degree:** B.Tech Computer Science and Engineering
* **Institution:** Vellore Institute of Technology (VIT)
* **Team ID:** `NS26`
* **Faculty Guide:** Dr. D. Vivek
* **Team Members:**
  1. **Niranjana Vijayaraghavan** (`23BCE0780`)
  2. **Kashish** (`23BCE0314`)
  3. **Priyal Chamaria** (`23BCE2100`)

---

## ⚡ Instant Demo Accounts (Password: `canteen123`)

On the login screen, click any of the **1-Click Demo Personas** to log in instantly without typing:

| Role | Username / Reg No | Password | Description / Assigned Scope |
| :--- | :--- | :--- | :--- |
| **Student** | `23BCE0314` | `canteen123` | Kashish — Live wait times, check-in to queues, single-stall collision guard |
| **Student** | `23BCE0780` | `canteen123` | Niranjana — Live wait times, student actions |
| **Staff** | `STAFF001` | `canteen123` | Counter Staff — Burger Point (`stall_001`): +1, -1, set absolute count |
| **Staff** | `STAFF002` | `canteen123` | Counter Staff — South Indian Corner (`stall_002`) |
| **Admin** | `ADMIN001` | `canteen123` | Administrator — Switch between all stalls, edit service times, CRUD stalls & menus, view 5 aggregation dashboards |

---

## 🚀 Key Architectural Highlights & Engineering Innovations

### 1. Wait Time Formula
$$\text{Estimated Wait (minutes)} = \mathrm{round}\left( \frac{\text{Queue Length} \times \text{Average Service Time (min)}}{\text{Active Counters}} \right)$$

### 2. 3-Tier Visual Queue Banding
* 🟢 **Green Band ($\le 5\text{ min}$):** Minimal wait; ideal for prompt service.
* 🟡 **Amber Band ($6\text{--}15\text{ min}$):** Moderate traffic; plan accordingly.
* 🔴 **Red Band ($> 15\text{ min}$):** Heavy congestion; prompts student load balancing to other stalls.
* **Dot Queue Strip:** Renders up to 20 individual colored queue nodes with `+N` badge for overflow.

### 3. Collision-Guarded Check-In System
Prevents "phantom queues": A student cannot join multiple queues simultaneously. Attempting to join a second stall requires explicitly checking out from the active queue first.

### 4. Hybrid Dual-Database Architecture
* **MongoDB:** Durable ACID storage for stalls, menus, operating hours, user profiles, and queue history events (`queue_events` collection with indexing).
* **Redis:** In-memory caching for sub-millisecond atomic counter operations (`INCRBY`, `DECRBY`, `SET`) and pub/sub push notifications via `Socket.IO`.
* **Zero-Backend Client Engine (`mockStore.js`):** Built-in fallback engine ensuring the app is 100% functional even when offline or deployed on static CDNs like GitHub Pages.

### 5. Five Advanced MongoDB Aggregation Pipelines
1. **Estimate Accuracy (`$lookup` + `$group`):** Compares mathematical estimated wait against actual completed student turnaround time.
2. **Peak Congestion Hours (`$dateToString` + `$group` + `$sort`):** Identifies rush-hour patterns (1:00 PM lunch, 5:00 PM snacks).
3. **Daily Footfall Distribution (`$group` + `$sum`):** Daily served customer counts across food stalls.
4. **Menu Pricing & Availability Statistics (`$unwind` + `$group`):** Computes average menu prices, max price, and availability ratio.
5. **Staff Manual Correction Audit (`$match` + `$project` + `$group`):** Measures frequency and absolute drift when staff override digital queue counts.

---

## 📂 Project Structure

```
canteenlive-reference-project/
├── .github/
│   └── workflows/
│       └── deploy.yml                   # Automated GitHub Actions deployment to GitHub Pages
├── canteenlive/
│   ├── client/                          # React + Vite Frontend
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── Stalls.jsx           # Screen 1: Stall cards, live badges, fastest stall
│   │   │   │   ├── StallDetail.jsx      # Screen 2: Stall view, menu, hours, check-in
│   │   │   │   ├── Staff.jsx            # Screen 3: Live counter (+1, -1, set count, audit trail)
│   │   │   │   ├── Manage.jsx           # Screen 4: Full MongoDB CRUD for stalls & menus
│   │   │   │   ├── Analytics.jsx        # Screen 5: 5 MongoDB aggregation pipeline metrics
│   │   │   │   └── Login.jsx            # Screen 6: 1-click persona quick login
│   │   │   ├── api.js                   # API client with seamless offline fallback
│   │   │   ├── mockStore.js             # Client-side state & BroadcastChannel engine
│   │   │   ├── socket.js                # Real-time WebSocket / mock broadcast listener
│   │   │   └── components.jsx           # Dot strips, badges, notices, time formatters
│   │   ├── vite.config.js               # Relative base configuration for hosting
│   │   └── package.json
│   ├── server/                          # Node.js + Express Backend
│   │   ├── src/
│   │   │   ├── db/                      # MongoDB models, Redis client, seed scripts
│   │   │   └── routes/                  # REST API endpoints & Socket.IO events
│   │   └── package.json
│   ├── docs/                            # Academic Deliverables
│   │   ├── CanteenLive_Final_Project_Report.docx    # 26-page Comprehensive Academic Report
│   │   ├── CanteenLive_Final_Review_35_Slides.pptx  # 35-slide Final Review Presentation Deck
│   │   └── CanteenLive_Submission_Checklist.docx    # Final submission checklist
│   ├── Run_CanteenLive_Demo.bat         # 1-click local launch batch file
│   └── Push_To_GitHub.bat               # 1-click git sync batch file
└── README.md                            # Main project overview & documentation
```

---

## 🖥️ How to Run Locally

### Method 1: One-Click Desktop Batch File
Simply double click `Run_CanteenLive_Demo.bat` inside the `canteenlive` folder. It will start the frontend on port 5173 and automatically open your default browser.

### Method 2: Command Line
```bash
# 1. Navigate to the client folder
cd canteenlive/client

# 2. Install dependencies (if not already installed)
npm install

# 3. Start development server
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 📑 Evaluation Deliverables (in `canteenlive/docs/`)

| File Name | Format | Description |
| :--- | :--- | :--- |
| **`CanteenLive_Final_Project_Report.docx`** | Microsoft Word (.docx) | 26-Page Academic Project Report conforming to university formatting guidelines with full chapter breakdown, diagrams, schema definitions, and aggregation pipelines. |
| **`CanteenLive_Final_Review_35_Slides.pptx`** | PowerPoint (.pptx) | 35-Slide Presentation Deck covering Problem Statement, Architecture, ER Diagram, Normalization, Redis, Performance Benchmark, and Live Demo Walkthrough. |
| **`CanteenLive_Submission_Checklist.docx`** | Microsoft Word (.docx) | Detailed checklist tracking all deliverables, code files, databases, and review criteria. |
