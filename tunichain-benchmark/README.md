# Tunichain Performance Benchmarking

This repository contains the **Hyperledger Caliper** benchmark results for evaluating the performance of Tunichain's smart contracts on a **Hyperledger Besu** network. It also includes the terminal output of the **custom Hardhat test protocol**, which validates gas costs, security roles, advanced security scenarios, and event correctness, as well as the results of a **Slither** static analysis for vulnerability detection.

## Overview

The experimental protocol benchmarks the **4 core smart contract operations** of the Tunichain platform. Each operation is tested at **4 different transaction-per-second (TPS) rates**, producing a total of **16 benchmark rounds**. The goal is to measure **throughput**, **latency**, and **success rate** under varying loads.

## Content
- [Tunichain Performance Benchmarking](#tunichain-performance-benchmarking)
  - [Overview](#overview)
  - [Content](#content)
  - [Project Structure](#project-structure)
  - [Caliper banchmark](#caliper-banchmark)
    - [Network Setup](#network-setup)
    - [Benchmark Configuration](#benchmark-configuration)
    - [TPS Rate Strategy](#tps-rate-strategy)
    - [Execution Order](#execution-order)
    - [Reports](#reports)
  - [Custom Test Protocol Results](#custom-test-protocol-results)
  - [Static Analysis (Slither)](#static-analysis-slither)
    - [Initial Findings](#initial-findings)
    - [After Refactoring](#after-refactoring)
    - [Remaining Findings](#remaining-findings)
  - [Related Repositories](#related-repositories)

## Project Structure

```
tunichain-benchmark/
├── hardhat-custom-tests-output.txt    # Custom test protocol terminal output
├── report1.html                       # Benchmark report #1
├── report2.html                       # Benchmark report #2
├── report3.html                       # Benchmark report #3
├── report4.html                       # Benchmark report #4
└── README.md                          # This file
```

## Caliper banchmark
### Network Setup

All benchmarks were executed on a **Hyperledger Besu** private network running in **Docker containers**. Four Besu **IBFT 2.0 validator nodes** and one **non-validator node** are created to simulate a base network suitable for development and performance testing.

### Benchmark Configuration

4 basic operations were tested. Each operation corresponds to a smart contract function on the Tunichain blockchain. They are tested sequentially, with each operation going through 4 rounds at increasing TPS rates.

---

**1. `addSeller` - Seller Registration**

**Transactions per round:** 100

This operation registers a new seller on the blockchain by calling the `Registry` smart contract. Each transaction stores the seller's wallet address and associates it with a seller role. This is a write-heavy operation that modifies on-chain state and is typically initiated by the Tax Administration.

| Round             | TPS | Description                                                                        |
| ----------------- | --- | ---------------------------------------------------------------------------------- |
| `addSeller-1tps`  | 1   | Latency-focused - measures individual transaction response time under minimal load |
| `addSeller-5tps`  | 5   | Low throughput - begins to introduce concurrency                                   |
| `addSeller-10tps` | 10  | Medium throughput - tests moderate network utilization                             |
| `addSeller-15tps` | 15  | Stress test - pushes toward the network's capacity limit                           |

---

**2. `addBank` - Bank Registration**

**Transactions per round:** 50

This operation registers a new bank on the blockchain through the `Registry` smart contract. Similar to seller registration, it stores the bank's wallet address and assigns the bank role. It is a simpler transaction with fewer entities, hence the lower transaction count.

| Round           | TPS | Description                                          |
| --------------- | --- | ---------------------------------------------------- |
| `addBank-1tps`  | 1   | Latency-focused - baseline response time measurement |
| `addBank-5tps`  | 5   | Low throughput - light concurrent load               |
| `addBank-10tps` | 10  | Medium throughput - moderate concurrency             |
| `addBank-15tps` | 15  | Stress test - high-frequency registration            |

---

**3. `submitInvoice` - Invoice Submission**

**Transactions per round:** 200

This is the most complex operation. Each transaction calls the `InvoiceValidation` smart contract to submit an invoice. The contract receives the invoice hash, the amount (randomly generated between 100,000 and 10,000,000), and applies a **19% VAT rate**. The smart contract computes VAT, validates the invoice data, and emits events for off-chain synchronization. This operation is computationally heavier than registration operations because it involves hashing, arithmetic, and multiple storage writes.

| Round                 | TPS | Description                                                               |
| --------------------- | --- | ------------------------------------------------------------------------- |
| `submitInvoice-1tps`  | 1   | Latency-focused - measures per-transaction overhead of invoice processing |
| `submitInvoice-5tps`  | 5   | Low throughput - concurrent invoice submissions                           |
| `submitInvoice-10tps` | 10  | Medium throughput - realistic workload simulation                         |
| `submitInvoice-15tps` | 15  | Stress test - high-frequency invoice processing                           |

---

**4. `storePayment` - Payment Recording**

**Transactions per round:** 100

This operation records a payment proof against an existing invoice by calling the `PaymentRegistry` smart contract. Each transaction links a payment hash to a previously submitted invoice, associating it with the paying bank. This operation depends on invoices already existing on-chain (it receives `numberOfInvoices` as a parameter to reference valid invoice IDs).

| Round                | TPS | Description                                                       |
| -------------------- | --- | ----------------------------------------------------------------- |
| `storePayment-1tps`  | 1   | Latency-focused - measures per-transaction payment recording time |
| `storePayment-5tps`  | 5   | Low throughput - light payment processing                         |
| `storePayment-10tps` | 10  | Medium throughput - concurrent payment recordings                 |
| `storePayment-15tps` | 15  | Stress test - high-frequency payment ingestion                    |

---

### TPS Rate Strategy

All rounds use a **fixed-rate** controller, which sends transactions at a constant rate regardless of network response:

| TPS Level  | Purpose                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| **1 TPS**  | **Latency measurement** - Isolates per-transaction processing time with no queuing effects. Provides the baseline latency.  |
| **5 TPS**  | **Low load** - Introduces light concurrency. Helps identify when latency starts to increase due to block production time.   |
| **10 TPS** | **Medium load** - Simulates a realistic workload. Useful for detecting bottlenecks in consensus or state storage.           |
| **15 TPS** | **Stress test** - Pushes the Besu network toward its limits. Reveals maximum throughput and potential transaction failures. |

### Execution Order

The 16 rounds execute sequentially in this order:

1. `addSeller` × 4 TPS levels (1 → 5 → 10 → 15)
2. `addBank` × 4 TPS levels (1 → 5 → 10 → 15)
3. `submitInvoice` × 4 TPS levels (1 → 5 → 10 → 15)
4. `storePayment` × 4 TPS levels (1 → 5 → 10 → 15)

### Reports

Four benchmarks were run, and the results were generated as HTML reports. Each report contains detailed metrics per round, including:
- **Throughput** (successful TPS)
- **Average latency** (ms)
- **Min / Max latency**
- **Transaction success / failure count**

## Custom Test Protocol Results

This sub-project also contains the raw terminal output of the **custom Hardhat test protocol** in the file `hardhat-custom-tests-output.txt`. This file captures the complete output from executing the custom test suite against the Tunichain smart contracts. It includes:

- **Gas Cost & Functionality Tests** - Verifies core operations (`addSeller`, `addBank`, `submitInvoice`, `storePayment`) and reports the gas consumed by each.
- **Security Role Tests** - Ensures that only authorized roles (Tax Admin, registered Seller, registered Bank) can invoke restricted functions.
- **Advanced Security Tests** - Covers role revocation, duplicate prevention (invoice & payment hashes), admin-only function guards, and edge cases (zero-amount invoices, empty metadata).
- **Event Verification Tests** - Confirms that every emitted event (`SellerAdded`, `BankAdded`, `InvoiceStored`, `PaymentStored`, `VATRecorded`, `VATPaymentRecorded`) carries the correct parameters.

All **23 tests pass**, and the file also reports per-operation gas costs:

| Operation             | Gas Used (wei) |
| --------------------- | -------------- |
| Adding a seller       | 119,700        |
| Adding a bank         | 119,631        |
| Submitting an invoice | 275,514        |
| Storing a payment     | 278,847        |

## Static Analysis (Slither)

A **Slither** static analysis was performed on the Tunichain smart contracts both before and after refactoring the `VATControl` contract. Slither is a Solidity static analysis framework that detects vulnerabilities, code quality issues, and optimization opportunities. The analysis covered **17 contracts** using **101 detectors**.

### Initial Findings

| Severity      | Count |
| ------------- | ----- |
| High          | 0     |
| Medium        | 3     |
| Low           | 0     |
| Informational | 8     |
| Optimization  | 7     |

**Total: 18 findings**

Initial findings showed us that there's 3 medium-severity issues. The medium-severity issues were **unused return values** in `VATControl.recordInvoiceTax()` and `VATControl.recordPayment()`, where return values from `invoiceReg.invoices()` and `paymentReg.payments()` were being silently ignored.

### After Refactoring

| Severity      | Count |
| ------------- | ----- |
| High          | 0     |
| Medium        | **0** |
| Low           | 0     |
| Informational | 8     |
| Optimization  | 7     |

**Total: 15 findings** - the 3 medium-severity unused-return-value issues were **fully resolved** by refactoring the `VATControl` contract.

### Remaining Findings

All remaining findings are either informational or optimization suggestions, none of which represent security risks.

## Related Repositories

This benchmarking protocol is part of the [Tunichain](https://github.com/Ghorbel37/Tunichain) project:

- [`tunichain-hardhat`](../tunichain-hardhat/) - Smart contracts
- [`tunichain-backend`](../tunichain-backend/) - Off-chain API server
- [`tunichain-frontend`](../tunichain-frontend/) - Web application

Developed by [Ghorbel37](https://github.com/Ghorbel37)
