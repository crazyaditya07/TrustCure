# TrustCure Frontend

A modern, production-ready React frontend for TrustCure - a blockchain-based supply chain tracking system.

## Features

- **Blockchain Integration**: Connect with Ethereum blockchain for product tracking
- **Role-based Dashboard**: Different views for Manufacturers, Distributors, Retailers, and Consumers
- **Product Verification**: QR code scanning and manual verification with complete supply chain journey
- **Supply Chain Timeline**: Visual timeline showing product journey from manufacturer to consumer
- **Real-time Stats**: Live dashboard with product statistics and activity feed

## Tech Stack

- React 19 + Vite
- Tailwind CSS 3.4
- Framer Motion (animations)
- React Router (navigation)
- Lucide React (icons)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Project Structure

```
trustcure-frontend/
├── src/
│   ├── components/       # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── DashboardCard.jsx
│   │   ├── Timeline.jsx
│   │   ├── ProductCard.jsx
│   │   └── AnimatedButton.jsx
│   ├── pages/           # Page components
│   │   ├── Home.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Verify.jsx
│   │   └── CreateProduct.jsx
│   ├── data/            # Mock data
│   │   └── mockProducts.js
│   ├── styles/          # Global styles
│   │   └── globals.css
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── package.json
├── vite.config.js
├── tailwind.config.js
└── index.html
```

## Pages

### Home
- Hero section with animated heading
- Supply chain flow visualization
- Feature cards
- Statistics display

### Dashboard
- Stats cards with animated counters
- Recent products grid
- Activity feed
- Quick actions
- Role badge display

### Verify
- QR scanner placeholder UI
- Manual product ID input
- Product verification results
- Supply chain timeline

### Create Product
- Product creation form
- Transfer ownership form
- Certification management
- Animated submission feedback

## Animations

All animations are implemented using Framer Motion:

- Page transitions
- Card hover effects
- Timeline progressive reveal
- Button hover states
- Loading animations
- Counter animations

## Theme

Dark professional theme with:
- Deep dark backgrounds
- Indigo/purple accent colors
- Subtle gradient overlays
- Glass morphism effects
- Clean spacing and hierarchy

## License

MIT
