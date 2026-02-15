# Tunichain Backend

This repository contains the backend services for the Tunichain project, built using Node.js and Express. The backend provides API endpoints, database management, and blockchain event listeners for the Tunichain platform.

## Features

- **Wallet Authentication**: Secure, non-custodial login using Sign-In with Ethereum (SIWE) for blockchain-based identity verification
- **Real-time Blockchain Sync**: Automated event listeners that keep the database in sync with on-chain activities
- **Smart Contract Integration**: Direct interaction with Ethereumv smart contracts for transparent operations
- **Invoice Management**: Create, read, update, and validate invoices
- **Seller Management**: Register and manage sellers with blockchain verification
- **Payment Processing**: Track and validate payments with blockchain integration
- **Bank Management**: Manage bank information and verification
- **Swagger API Documentation**: Interactive API documentation
- **Automated Data Validation**: Automatic verification of on-chain data against database records
- **Event-Driven Architecture**: Real-time processing of blockchain events for instant updates
- **Decentralized Identity**: Leverages blockchain addresses as user identities for enhanced security
- **Immutable Audit Trail**: All critical operations are recorded on the blockchain for transparency
- **Role-Based Access Control**: Fine-grained permissions based on on-chain roles and verifications
- **Smart Contract Event Monitoring**: Continuous tracking of contract events for data consistency
- **Off-Chain Data Validation**: Cross-verification of off-chain data with on-chain state

## Content
- [Tunichain Backend](#tunichain-backend)
  - [Features](#features)
  - [Content](#content)
  - [Project Structure](#project-structure)
  - [Usage and Development](#usage-and-development)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
    - [First-Time Setup](#first-time-setup)
    - [Deployment](#deployment)
    - [Available Commands](#available-commands)
  - [Author](#author)


## Project Structure

```
tunichain-backend/
├── abi/                    # Smart contract ABIs
├── config/                 # Configuration files
├── middleware/             # Express middleware
│   ├── auth.js            # Authentication middleware
│   └── rbac.js            # Role-based access control
├── models/                 # Mongoose models
│   ├── Bank.js
│   ├── Invoice.js
│   ├── Payment.js
│   ├── Seller.js
│   └── User.js
├── routes/                 # API route handlers
│   ├── authRoutes.js
│   ├── bankRoutes.js
│   ├── blockchainListener.js
│   ├── invoiceRoutes.js
│   ├── paymentRoutes.js
│   └── sellerRoutes.js
├── scripts/                # Utility scripts
│   ├── swagger/           # Swagger documentation
│   ├── clearDB.js         # Database cleanup script
│   └── initDB.js          # Database initialization
├── index.js               # Contains server routes and config
├── server.js              # Main application entry point
└── package.json
```

## Usage and Development
### Prerequisites

- Node.js (20+)
- MongoDB (5+)
- npm
- Ethereum node (for blockchain integration)

### Setup

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

### First-Time Setup

1. **Ethereum Node Setup**
   - Set up an Ethereum node (you can use the provided Hardhat project)
   - Deploy the smart contracts on it (you can use the provided script)
   - Ensure the node is running and accessible

2. **Environment Configuration**
   - Update the following variables in `.env`:
     ```
     # Replace with your Ethereum node URL
     RPC_URL=http://localhost:8545

     # Replace with your deployed contract addresses
     REGISTRY_ADDRESS=0x...
     INVOICE_VALIDATION_ADDRESS=0x...
     PAYMENT_REGISTRY_ADDRESS=0x...

     # Replace with funded wallet addresses for initial roles
     ADMIN_ADDRESS=0x...
     BANK_ADDRESS=0x...
     TTN_ADDRESS=0x...
     ```
   - If using the project's blockchain setup, the deployment script will automatically update the contract addresses in `.env`

3. **Database Initialization**
   Run the initialization script to create initial roles and admin user:
   ```bash
   npm run init:db
   ```
   This will set up the necessary roles and permissions in the database.

### Deployment
Make sure the blockchain node and MongoDB are running and accessible before deploying the application.

1. **Start the Application**
   ```bash
   npm start
   ```
   The server will start and connect to both the database and blockchain node.

2. **Verify Console**
   - Check the console for successful database connection
   - Verify event listeners are connected to the blockchain

### Available Commands

- `npm start` or `npm run server`: Start the server
- `npm run swagger`: Generate Swagger documentation
- `npm run clear:db`: Clear the database (use with caution)
- `npm run init:db`: Initialize the database with sample data
- `npm run reset:db`: Reset the database (clear and reinitialize)

## Author
Developed by [@Ghorbel37](https://github.com/Ghorbel37)