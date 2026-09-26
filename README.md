# DisasterResponder: Emergency Coordination Platform

**DisasterResponder** is a professional, high-performance full-stack application designed for real-time emergency triage, coordination, and dispatch management. It provides mission-critical tools for emergency responders to analyze, track, and manage disasters with sub-second response times.

---

## 🚀 Key Features

### 1. Intelligent Triage Engine
*   **Sub-Second Analysis**: Uses a sophisticated rule-based engine to instantly parse raw incident reports.
*   **Automatic Extraction**: Detects location, disaster type (Fire, Flood, Earthquake, etc.), and casualty estimates.
*   **Priority Ranking**: Categorizes incidents into Low, Medium, High, or Critical severity.

### 2. Live Incident Dashboard
*   **Mission Control**: A centralized view of all active incidents with color-coded severity cards.
*   **Real-time Updates**: Status tracking from 'Pending' to 'Active' and 'Resolved'.
*   **Log Management**: Dedicated dispatch logs for every incident to track unit movements and updates.

### 3. Advanced Map Visualization
*   **Geospatial Tracking**: Dynamic incident markers on an interactive city map.
*   **Tactical Overlays**: Toggleable Evacuation Radii, Traffic Congestion data, and Severe Weather Radar.
*   **Visual Priority**: Markers pulse based on severity level for immediate situational awareness.

### 4. Performance Analytics
*   **Deployment KPIs**: Real-time calculation of "Average Deployment Time" from report to dispatch.
*   **Volume Tracking**: 7-day incident volume charts visualizing system load.
*   **Resource Monitoring**: Hospital bed capacity (ICU, Trauma, Burn Units) and financial expenditure tracking.

### 5. Specialized Fleet Management
*   **Responder Teams**: Management interface for Fire, EMS, and Police units.
*   **Drone Fleet**: Dedicated surveillance drone monitoring and control dashboard.

### 6. Security & Safety
*   **Terminal Lock**: Integrated security PIN screen (Default PIN: 1234) for secure station handover.
*   **Emergency Siren**: City-wide alert system with visual and auditory (simulated) notification.
*   **Emergency Ticker**: Real-time scrolling ticker for severe weather and Amber alerts.

---

## 🛠️ Technical Architecture

### Frontend (Mission Control)
*   **Framework**: React (Vite)
*   **Styling**: Premium Vanilla CSS (Custom design system with Dark/Light modes)
*   **Visuals**: Recharts for analytics and dynamic SVG animations.
*   **State**: React Hooks for real-time UI updates.

### Backend (Command Center)
*   **API**: FastAPI (Python) - High-performance asynchronous endpoints.
*   **Database**: SQLite with SQLAlchemy ORM for reliable data persistence.
*   **Engine**: Rule-based triage pipeline (Optimized for speed and zero-dependency reliability).

---

## 🚦 Getting Started

### Prerequisites
*   **Python 3.9+**
*   **Node.js & npm**

### Easy Start (Windows)
Simply double-click the **`START.bat`** file in the root directory. It will:
1.  Clear any old sessions and reset the database.
2.  Launch the FastAPI Backend.
3.  Start the React Frontend.
4.  Open your browser to `http://localhost:5173`.

### Manual Setup

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔒 Security Information
*   **Default PIN**: `1234` (Configurable in `App.jsx`)
*   **System Admin**: Terminal requires authorization for City-Wide Siren activation.

---

Developed for high-stakes emergency coordination. 🚨
