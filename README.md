# Tunichain Frontend

Tunichain is a blockchain-powered platform designed to bring transparency and trust to digital commerce by connecting sellers, banks, and government institutions through a secure, decentralized ledger.

## Features

- **Multi-User Support**: Four distinct user roles with tailored interfaces
  - Tax Admin
  - TTN (Tax and Trade Network)
  - Sellers
  - Banks
- **Blockchain Integration**:
  - Secure and transparent transaction recording
  - Smart contract interactions
  - Real-time transaction verification
  - Immutable audit trail
- **Responsive Design**:
  - Built with React.js and Material-UI (MUI) components
  - Mobile-first approach
  - Consistent UI/UX across all devices
- **Secure Authentication**:
  - Web3 wallet login using Sign-In with Ethereum (SIWE)
  - Non-custodial authentication
  - Role-based access control
  - Seamless wallet connection

## Content
- [Tunichain Frontend](#tunichain-frontend)
  - [Features](#features)
  - [Content](#content)
  - [User Roles and Access](#user-roles-and-access)
  - [Project Structure](#project-structure)
  - [Usage and Development](#usage-and-development)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
    - [Deployment:](#deployment)
  - [Author](#author)


## User Roles and Access

1. **Tax Administration**
   - **Bank Management**
     - Add new banks to the platform
     - View and manage all registered banks
   - **Seller Management**
     - Register and verify sellers
     - View and manage all sellers' information
   - **Invoice Oversight**
     - View all invoices across all sellers
     - Filter invoices by seller
     - Access detailed invoice information
   - **Financial Monitoring**
     - View payment receipts for paid invoices
     - Track payment status across all transactions
   - **Reporting**
     - Generate monthly invoice reports for individual sellers
     - Export financial data for tax and audit purposes

2. **TTN (Tunisie TradeNet)**
   - **Seller Management**
     - View all registered sellers
   - **Invoice Oversight**
     - View all invoices across the platform
     - Filter invoices by seller
     - Access detailed invoice information
   - **Transaction Validation**
     - Mark invoices as valid or invalid
     - View validation history
   - **Financial Verification**
     - View payment receipts for paid invoices
     - Verify transaction authenticity

3. **Sellers**
   - **Invoice Management**
     - Create new invoices with line items and details
     - View all their invoices in one place
     - Access detailed view for each invoice
   - **Financial Tracking**
     - View payment status for all invoices
     - Track TTN validation status
     - View invoice history

4. **Banks**
   - **Payment Processing**
     - View all unpaid invoices
     - Add payment receipts to invoices
     - Mark invoices as paid with payment confirmation
   - **Payment History**
     - View all processed payments
     - Access payment receipts history

## Project Structure

```
src/
├── abi/                 # Smart contract ABIs
├── components/          # Reusable UI components
│   ├── InvoiceDetailsModal.jsx  # Modal for invoice details
│   ├── ProfileMenu.jsx          # User profile dropdown
│   ├── ProtectedRoute.jsx       # Route protection component
│   └── ResponsiveDrawer.jsx     # Main navigation drawer
├── context/            # React context providers
│   └── AuthContext.jsx # Authentication state management
├── pages/              # Page components
│   ├── About.jsx       # About page
│   ├── BankPayments.jsx # Payment management for banks
│   ├── Banks.jsx       # Bank management for Tax Administration
│   ├── Home.jsx        # Landing page
│   ├── Login.jsx       # Authentication page
│   ├── Profile.jsx     # User profile
│   ├── SellerInvoices.jsx # Seller-specific invoices
│   ├── Sellers.jsx     # Seller management for Tax Administration
│   ├── TaxInvoices.jsx # Invoice management for TTN and Tax Administration
│   ├── TaxPayments.jsx # Payment tracking for TTN and Tax Administration
│   ├── TaxSellerReport.jsx # Seller reports for Tax Administration
│   └── TaxSellers.jsx  # Seller management for TTN and Tax Administration
├── services/           # API and blockchain services
│   └── authServices.js # Authentication service
├── utils/              # Utility functions and helpers
│   └── apiClient.js    # API client with auth support
├── App.jsx             # Main application component with routing
└── main.jsx            # Application entry point (Contains routes)
```

## Usage and Development
### Prerequisites

- Node.js (20+)
- npm
- MetaMask or other Web3 wallet extension

### Setup

1. Clone the repository

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure environment variables
   Use the provided `.env.template` file to create a `.env` file in the root directory and replace the following variables with your actual values:
   ```
   VITE_BACKEND_URL=http://localhost:4000
   VITE_BLOCKCHAIN_RPC=localhost:8545
   VITE_BLOCKCHAIN_NAME=hardhat
   VITE_BLOCKCHAIN_CHAIN_ID=31337
   ```

### Deployment:
Make sure the Blockchain and Backend are running before deploying the frontend.

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Open in browser**
   The application will be available at `http://localhost:5173`

## Author
Developed by [@Ghorbel37](https://github.com/Ghorbel37)