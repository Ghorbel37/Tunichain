# Tunichain Smart Contracts

This repository contains the solidity smart contracts for the Tunichain project, built using Hardhat. The contracts manage access control using Registry, invoice validation, payment tracking, and VAT calculations for the Tunichain platform.

## Key Features

- **Access Control**: Secure role-based access for sellers, banks, and administrators
- **User Management**: Onboard and manage sellers and banks with approval workflows
- **Invoice Management**: Store and validate invoices with VAT calculations
- **Payment Tracking**: Record payments and associate them with invoices
- **VAT Calculation**: Automatic VAT calculation based on per-invoice rates
- **Event Emission**: Comprehensive event logging for off-chain processing

## Contents
- [Tunichain Smart Contracts](#tunichain-smart-contracts)
  - [Key Features](#key-features)
  - [Contents](#contents)
  - [Usage and Development](#usage-and-development)
    - [Prerequisites](#prerequisites)
    - [Setup](#setup)
    - [Quick Start (Hardhat Network)](#quick-start-hardhat-network)
    - [Deployment Script (`deploy-tunichain.js`)](#deployment-script-deploy-tunichainjs)
  - [Project Structure](#project-structure)
  - [Testing](#testing)
    - [Test Suite Features](#test-suite-features)
    - [Running Tests](#running-tests)
  - [Smart Contract Details](#smart-contract-details)
    - [Registry](#registry)
    - [InvoiceValidation](#invoicevalidation)
    - [PaymentRegistry](#paymentregistry)
    - [VATControl](#vatcontrol)
  - [Author](#author)

## Usage and Development
### Prerequisites

- Node.js (20+)
- npm
- Hardhat

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Quick Start (Hardhat Network)
For rapid development and testing, you can deploy directly to the Hardhat network:

1. Start a local Hardhat node in a terminal:
   ```bash
   npx hardhat node
   ```

2. In another terminal, run the deployment script provided:
   ```bash
   npx hardhat run scripts/deploy-tunichain.js --network localhost
   ```

This will:
- Deploy all contracts in the correct order
- Wire up contract dependencies
- Update environment variables
- Copy ABIs to frontend/backend

### Deployment Script (`deploy-tunichain.js`)

This helper script automates the deployment and setup process:

1. **Deploys contracts** in the correct order:
   - Registry
   - InvoiceValidation
   - PaymentRegistry
   - VATControl

2. **Configures contract relationships**:
   - Sets up VATControl in both InvoiceValidation and PaymentRegistry
   - Establishes proper permissions and connections

3. **Updates environment**:
   - Updates `.env` files in the hardhat, backend, and frontend folders
   - Handles both local and remote deployments

4. **Copies ABIs**:
   - Copies contract ABIs to `../tunichain-frontend/src/abi/`
   - Copies contract ABIs to `../tunichain-backend/abi/`

> **Note**: This script is designed for Hardhat development environment only and is provided as a convenience for local development and testing.

## Project Structure

```
hardhat/
├── contracts/                # Smart contracts
│   ├── Registry.sol          # User and role management
│   ├── InvoiceValidation.sol # Invoice storage and validation
│   ├── PaymentRegistry.sol   # Payment receipt management
│   └── VATControl.sol        # VAT calculation and tracking
├── test/                     # Test files
│   └── Tunichain.ts          # Main test suite
├── scripts/                  # Deployment and utility scripts
│   └── deploy-tunichain.js   # Main deployment script
└── ignition/                 # Hardhat Ignition deployment modules
```

## Testing

The project includes a comprehensive test suite that verifies the functionality and performance of the smart contracts. The test suite is written in TypeScript using Hardhat's testing environment.

### Test Suite Features

- **Access Control and Security Testing**: 
  - Validates role-based permissions for admins, sellers, and banks
  - Ensures only authorized users can perform specific actions
  - Tests registration and approval workflows
  - Verifies role revocation and access denial
  - Prevents duplicate transactions and unauthorized access

- **Gas Usage Analysis**:
  - Measures gas consumption for all major operations
  - Tracks gas costs for:
    - User registration (adding sellers and banks)
    - Invoice submission and validation by sellers
    - Payment processing by banks

- **Integration Testing**:
  - Ensures proper event emission
  - Tests correct interaction between contracts
  - Validates state changes and access control across contracts
  - Verifies proper handling of edge cases and invalid operations

### Running Tests

```bash
# Run all tests
npx hardhat test ./test/Tunichain.ts
```

The test suite serves as both a verification tool and documentation of the expected behavior of the smart contracts.

## Smart Contract Details

### Registry
The Registry contract serves as the central access control mechanism for the Tunichain platform. It:
- Manages user roles and permissions (sellers, banks, admins)
- Handles seller and bank registration and approval
- Controls access to platform features based on user roles
- Maintains whitelists for approved participants

### InvoiceValidation
- Stores invoice data with VAT information
- Emits events for invoice creation
- Integrates with VATControl for tax calculations

### PaymentRegistry
- Records payment receipts
- Matches payments to invoices
- Triggers VAT calculations on payment

### VATControl
- Manages VAT rates and calculations
- Tracks tax base, VAT owed, and VAT paid
- Provides view functions for tax reporting

## Author
Developed by [@Ghorbel37](https://github.com/Ghorbel37)