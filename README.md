# 🛡️ TrustCure: Decentralized Supply Chain Integrity

**TrustCure** is a next-generation decentralized pharmaceutical supply chain tracking system. By leveraging blockchain technology and real-time data synchronization, TrustCure ensures that medicines and medical products are tracked with absolute transparency from the factory floor to the patient's hands.

---

## ✨ Key Features

- **Immutable Audit Trail**: Every movement is recorded as an on-chain transaction.
- **Role-Based Workflows**: Tailored interfaces for Manufacturers, Distributors, and Retailers.
- **Real-Time Synchronisation**: Instant UI updates via Socket.io when blockchain events occur.
- **Ownership Verification**: cryptographically proven ownership transfers.
- **Checkpoint History**: Comprehensive location-tagged timeline for every product.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Blockchain** | ![Solidity](https://img.shields.io/badge/Solidity-363636?style=flat&logo=solidity&logoColor=white) | Smart contracts (ERC-721 NFTs) |
| **Network** | ![Ethereum](https://img.shields.io/badge/Sepolia_Testnet-3C3C3D?style=flat&logo=ethereum&logoColor=white) | Decentralized ledger layer |
| **Frontend** | ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) | Modern, responsive dashboard and UI |
| **Styling** | ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white) | Premium glassmorphism aesthetics |
| **Backend** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white) | API layer and Event Listeners |
| **Database** | ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white) | Persistent storage for enriched product metadata |
| **Real-time** | ![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socketdotio&logoColor=white) | Live event notifications |

---

## 🚀 The Workflow

1.  **Minting**: Manufacturers create a unique NFT for each product batch, defining its origin and initial attributes.
2.  **Custody Transfer**: Products move through the chain (Manufacturer → Distributor → Retailer) via verified on-chain transfers.
3.  **Checkpoint Logging**: Every recipient must sign a transaction, automatically creating an immutable checkpoint with location data.
4.  **Verification**: Retailers and Consumers can scan the product to view its entire verified history and confirm its authenticity.

---

## 💎 Project Advantages

- **Eliminates Counterfeits**: Only products minted by verified manufacturers can exist in the system.
- **Regulatory Compliance**: Provides a ready-to-use audit log for compliance bodies.
- **Trustless Verification**: No middleman required to verify product origin.
- **High Performance**: Hybrid architecture (Blockchain + MongoDB) ensures the UI is snappy while data is secure.

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or Atlas)
- MetaMask extension installed

### Backend Setup
```bash
cd backend
npm install
# Configure .env with your MONGODB_URI and SEPOLIA_RPC_URL
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

<div align="center">
  <p>Built with ❤️ for a safer supply chain.</p>
  <img src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" />
</div>