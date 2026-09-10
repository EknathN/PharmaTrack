# PharmaTrack Pro — Secure Pharmaceutical Supply Chain

PharmaTrack Pro is an enterprise-grade pharmaceutical provenance, tracking, and anti-counterfeiting platform. It guarantees end-to-end custody verification from drug manufacturing to pharmacy dispensing, reverse returns, and certified bio-destruction.

---

## 🚀 Key Features

- **End-to-End Chain of Custody**: Tracks batches across Manufacturer, Distributor, Retailer, and Disposer with cryptographic provenance.
- **Dual QR Code Architecture**:
  - **Human-Readable Multi-Line QR**: Readable by standard phone cameras (Medicine, Batch No, Dates, Quantities).
  - **In-App Auto-Extraction**: Automatically extracts clean `BAT-xxxxxxxx` identifiers for automated verification and stock allocation.
- **Print Shipping Mandate (Shipping Labels)**:
  - Generate and print courier-compliant shipping labels for all shipment types (Forward, Return, Disposal).
  - Contains large Primary Crate QR, Batch Verification QR, Routing cards, and Driver/Consignee sign-off blocks.
  - Thermal label and A4 laser printer friendly with print-optimized CSS.
- **Retailer Multi-Language Portal**:
  - Instant dynamic switching across **9 languages**: English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, and Gujarati.
- **Host Regulatory & Surveillance Dashboard**:
  - Complete ecosystem transparency for regulatory authorities and healthcare administrators.
  - Ability to inspect dossiers, flag suspicious batches, freeze compromised inventory, and audit reverse returns.
- **Near-Expiry & Reverse Logistics**:
  - Automated threshold alerts (60-day / 30-day).
  - Return to distributor/manufacturer and disposal routing to certified bio-destruction facilities with video and photo POD upload.

---

## 🏗️ Project Architecture

```
Pharmatrack_Pro/
├── frontend/               # Next.js 14 App Router, TypeScript, Tailwind CSS
│   ├── src/
│   │   ├── app/            # Next.js App Router (Portals: Manufacturer, Distributor, Retailer, Disposer, Host)
│   │   │   ├── actions/    # Server actions (Batches, Shipments, Auth)
│   │   │   ├── shipments/  # Printable Mandate Route (/shipments/[id]/mandate)
│   │   │   └── ...
│   │   ├── components/     # UI Components, QR Scanners, Status Badges
│   │   └── lib/            # DB helpers, i18n dictionaries, QR generators
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                # FastAPI Microservice (Optional Python Service)
│   ├── routers/            # API endpoints (auth, batches, shipments, disposal)
│   ├── models.py           # SQLAlchemy database models
│   ├── schemas.py          # Pydantic schemas
│   ├── requirements.txt    # Python dependencies
│   └── main.py
│
├── .gitignore              # Multi-tier ignore rules (node_modules, venv, .next, .env)
└── README.md
```

---

## 🛠️ Quick Start

### 1. Frontend Setup (Next.js)

```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Demo Credentials:
- **Manufacturer**: `manufacturer@pharmatrack.com` / `password123`
- **Distributor**: `distributor@pharmatrack.com` / `password123`
- **Retailer**: `retailer@pharmatrack.com` / `password123`
- **Disposer**: `disposer@pharmatrack.com` / `password123`
- **Host (Auditor)**: `host@pharmatrack.com` / `password123`

### 2. Backend Setup (FastAPI - Optional)

```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Backend API docs available at: [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 📄 License
MIT License
