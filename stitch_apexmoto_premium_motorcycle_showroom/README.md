# APEX MOTORRAD // Flagship Superbike Showroom & Telemetry Lab

A high-performance digital showroom and telemetry analytics platform for elite motorcycle collectors, track riders, and motorsport enthusiasts. Engineered with **High-Contrast Dark Luxury** and **Motorsport Brutalism** design principles.

---

## ⚡ Key Interactive Features

### 1. 🏁 Interactive Dyno Power Curve Analyzer (HTML5 Canvas)
- Real-time animated RPM sweep from idle (1,800 RPM) to redline (16,000 RPM).
- Visualizes horsepower (Crimson Red) and torque curves (Brushed Titanium White).
- Dynamic machine switcher (Ducati Panigale V4R, BMW M 1000 RR, Kawasaki Ninja H2 Carbon, Aprilia RSV4, KTM 1290 Super Duke, etc.).
- Live callout displays for peak wheel output, maximum torque, and rev limiter thresholds.

### 2. 🔊 Acoustic Superbike Exhaust Note Synthesizer (Web Audio API)
- Pure synthesized multi-oscillator audio harmonics replicating genuine firing orders:
  - 90° Desmodromic V4 (Ducati Corse)
  - ShiftCam Inline-4 screamer (BMW Motorrad)
  - Centrifugal Supercharger planetary gear whine (Kawasaki H2)
  - Crossplane CP4 uneven firing cadence (Yamaha Racing)
  - 75° LC8 V-Twin visceral growl (KTM Motorsport)
- Live animated button state and telemetry rev indicator.

### 3. 🏍️ Homologation Fleet Directory & Multi-Faceted Filter Matrix
- **12 Homologated Flagship Machines** with verified factory telemetry.
- Instant manufacturer filters: *Ducati, BMW Motorrad, Kawasaki, Yamaha, KTM, Aprilia, Triumph, Honda, Energica, Royal Enfield*.
- Live sorting: *Recommended, Highest Horsepower, Top Speed, Lightest Dry Weight, Price Low-to-High, Price High-to-Low*.
- Instant keyboard search (`/` shortcut) with live verified allocation count.

### 4. ⚔️ Head-to-Head Titan Comparison Matrix
- Direct side-by-side metric comparison between any two machines in the catalog.
- Comparative delta bars for Peak Output (HP), Torque, Power-to-Weight ratio, Dry Weight, 0-100 km/h acceleration, and GPS Top Speed.
- Quick presets: *Ducati V4R vs. BMW M 1000 RR*, *Ninja H2 vs. YZF-R1M*, *Super Duke vs. Fireblade SP*, *Aprilia RSV4 vs. Panigale V4R*.
- Clean printable telemetry report layout with one-click print/PDF export.

### 5. 🔍 Bespoke Bike Specification Modal
- Deep mechanical telemetry breakdown: Bore x Stroke, compression ratio, gearbox/quickshift, dry weight, fuel capacity, seat height.
- Interactive **Factory Colorway Switcher** with live preview badge.
- Direct quick links to book circuit sessions or run financing estimates.

### 6. 💳 Apex Capital Lease & Financing Calculator
- Real-time monthly payment calculations based on MSRP, custom down payment, loan/lease terms (24, 36, 48, 60 months), and APR interest rate slider (2.9% - 9.9%).
- Toggleable *Apex Track Concierge & Engine Warranty Shield* (+$89/mo).
- Live calculation of total interest charge and principal outlay.

### 7. 🎟️ Digital Homologation Circuit Pass Generator
- Reserve test rides across legendary venues: *Circuit of The Americas (COTA), Laguna Seca, Silverstone, Monza, Nürburgring Nordschleife, and Apex Private Dyno Bunker*.
- Generates a high-tech **Digital Track Voucher Pass** with unique allocation ID, pilot credentials, machine chassis spec, and printable barcode authentication token.

### 8. ❤️ Paddock Garage Shortlist (Persistent Storage)
- Save and curate dream superbike collections with one click.
- Saved machines persist locally in the user's browser via `localStorage`.
- Dedicated sliding drawer for reviewing and scheduling auditions.

### 9. 🎯 Interactive Hero Hotspots
- Clickable aerodynamic and mechanical telemetry reticles on the hero machine:
  - `[01]` Carbon Biplane Winglets (30kg downforce at 270 km/h)
  - `[02]` Brembo Stylema Calipers (330mm discs & Bosch 9.1 EVO ABS)
  - `[03]` Öhlins Smart EC 2.0 Electronic Damper System
  - `[04]` Akrapovič Titanium Full-Race Exhaust (-6kg weight)

---

## 🎨 Design System Specifications (`DESIGN.md` Compliant)

- **Palette**:
  - `Primary Race Red`: `#ff1a35` / `#dc001c`
  - `Deep Void Substrate`: `#0e0e10` / `#131315` / `#1c1b1d` / `#201f21`
  - `Titanium Wireframe & Hairlines`: `#2e2e38` / `#404050`
  - `High-Contrast Text`: Stark White (`#ffffff`) & Ghost Platinum (`#a1a1aa`, `#71717a`)
- **Typography**:
  - `Headlines`: **Syne** (Intimidating scale with tight tracking)
  - `Body`: **Inter** (Neutral, Swiss geometric legibility)
  - `Telemetry Metrics & Badges`: **JetBrains Mono** (Instrument cluster readability)
- **Geometry**: Radical 0px border-radius, chamfered corner cuts, laser grid overlays, and segmented meters.

---

## 📁 Project Architecture

```
stitch_apexmoto_premium_motorcycle_showroom/
│
├── index.html                   # Primary production web application
├── README.md                    # Project documentation & feature manual
│
├── assets/
│   ├── css/
│   │   └── apex.css             # Performance design system, telemetry grids, laser glow
│   ├── js/
│   │   ├── bikes-data.js        # 12-bike telemetry database (specs, dyno curves, colorways)
│   │   └── app.js               # Application logic, audio synthesis, dyno canvas, filtering
│   └── images/
│       ├── logo.png             # Local Apex Motorrad brand mark
│       └── hero-crimson-carbon.png # 1.5MB 4K dark studio hero shot
│
└── apex_velocity/
    └── DESIGN.md                # Official design tokens and style guide
```

---

## 🚀 How to Run Locally

Because the project is built with vanilla HTML5, Tailwind CSS, and standard Web APIs, it requires zero build steps or package installations.

### Option 1: Direct File Open
Simply double-click `index.html` or open it with any modern web browser:
```
file:///c:/Users/siddharth/OneDrive/Desktop/stitch_apexmoto_premium_motorcycle_showroom/index.html
```

### Option 2: Local Web Server
You can serve the directory using any static file server:

```powershell
# Using Python (if available):
python -m http.server 8080

# Using Node.js npx serve (if available):
npx serve .
```
Then navigate to `http://localhost:8080` in your browser.
