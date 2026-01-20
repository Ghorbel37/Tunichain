import assert from "node:assert/strict";
import { describe, it, before } from "node:test";

import { network } from "hardhat";

describe("Tunichain", async function () {
    const { viem } = await network.connect();
    const publicClient = await viem.getPublicClient();
    const walletClients = await viem.getWalletClients();

    // Test accounts: admin (taxAdmin), seller, bank, unauthorized
    const adminClient = walletClients[0];
    const sellerClient = walletClients[1];
    const bankClient = walletClients[2];
    const unauthorizedClient = walletClients[3];

    const adminAddress = adminClient.account.address;
    const sellerAddress = sellerClient.account.address;
    const bankAddress = bankClient.account.address;
    const unauthorizedAddress = unauthorizedClient.account.address;

    // Contract instances
    let registry: any;
    let invoiceValidation: any;
    let paymentRegistry: any;
    let vatControl: any;

    // Deploy all contracts before tests
    before(async () => {
        // 1) Deploy Registry with admin as TAX_ADMIN
        registry = await viem.deployContract("Registry", [adminAddress]);

        // 2) Deploy InvoiceValidation with registry address
        invoiceValidation = await viem.deployContract("InvoiceValidation", [registry.address]);

        // 3) Deploy PaymentRegistry with registry and invoiceValidation addresses
        paymentRegistry = await viem.deployContract("PaymentRegistry", [
            registry.address,
            invoiceValidation.address,
        ]);

        // 4) Deploy VATControl with invoiceValidation and paymentRegistry addresses
        vatControl = await viem.deployContract("VATControl", [
            invoiceValidation.address,
            paymentRegistry.address,
        ]);

        // 5) Wire up VATControl to the other contracts
        await invoiceValidation.write.setVATControl([vatControl.address]);
        await paymentRegistry.write.setVATControl([vatControl.address]);

        // 6) Add seller and bank for gas cost tests
        await registry.write.addSeller([sellerAddress, "Test Seller"]);
        await registry.write.addBank([bankAddress, "Test Bank"]);
    });

    // ============================================
    // GAS COST & FUNCTIONALITY TESTS
    // ============================================

    describe("Gas Cost & Functionality Tests", async function () {
        it("Should allow taxAdmin to add a seller", async function (t) {
            const newSellerAddress = "0x1111111111111111111111111111111111111111";

            const txHash = await registry.write.addSeller([newSellerAddress, "New Seller"]);
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

            t.diagnostic(`Gas used for adding a seller: ${receipt.gasUsed.toString()}`);

            // Verify it was actually added
            const isSeller = await registry.read.isSeller([newSellerAddress]);
            assert.ok(isSeller, "Seller should be active");
        });

        it("Should allow taxAdmin to add a bank", async function (t) {
            const newBankAddress = "0x2222222222222222222222222222222222222222";

            const txHash = await registry.write.addBank([newBankAddress, "New Bank"]);
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

            t.diagnostic(`Gas used for adding a bank: ${receipt.gasUsed.toString()}`);

            // Verify it was actually added
            const isBank = await registry.read.isBank([newBankAddress]);
            assert.ok(isBank, "Bank should be active");
        });

        it("Should allow registered seller to submit an invoice", async function (t) {
            const invoiceHash = "0x" + "ab".repeat(32);
            const amount = 1000000n;
            const vatRatePermille = 190n;

            const txHash = await invoiceValidation.write.submitInvoice(
                [invoiceHash, amount, vatRatePermille],
                { account: sellerClient.account }
            );
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

            t.diagnostic(`Gas used for adding an invoice: ${receipt.gasUsed.toString()}`);

            // Verify invoice exists
            const invId = await invoiceValidation.read.getInvoiceIdByHash([invoiceHash]);
            assert.ok(invId > 0n, "Invoice should be stored");
        });

        it("Should allow registered bank to add a payment receipt", async function (t) {
            // Setup: submit an invoice first
            const invoiceHash = "0x" + "cd".repeat(32);
            await invoiceValidation.write.submitInvoice(
                [invoiceHash, 500000n, 190n],
                { account: sellerClient.account }
            );

            const paymentHash = "0x" + "ef".repeat(32);
            const amountPaid = 595000n;

            const txHash = await paymentRegistry.write.storePayment(
                [paymentHash, invoiceHash, amountPaid],
                { account: bankClient.account }
            );
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

            t.diagnostic(`Gas used for adding a payment receipt: ${receipt.gasUsed.toString()}`);

            // Verify payment exists
            const payId = await paymentRegistry.read.paymentHashToId([paymentHash]);
            assert.ok(payId > 0n, "Payment should be stored");
        });
    });

    // ============================================
    // SECURITY / ROLE TESTS
    // ============================================

    describe("Security Role Tests", async function () {
        describe("Registry Access Control", async function () {
            it("Should REJECT unauthorized users from adding sellers", async function () {
                const addr = "0x5555555555555555555555555555555555555555";
                await assert.rejects(
                    async () => {
                        await registry.write.addSeller([addr, "Fail"], { account: unauthorizedClient.account });
                    },
                    /AccessControlUnauthorizedAccount/
                );
            });

            it("Should REJECT unauthorized users from adding banks", async function () {
                const addr = "0x6666666666666666666666666666666666666666";
                await assert.rejects(
                    async () => {
                        await registry.write.addBank([addr, "Fail"], { account: unauthorizedClient.account });
                    },
                    /AccessControlUnauthorizedAccount/
                );
            });
        });

        describe("InvoiceValidation Access Control", async function () {
            it("Should REJECT non-sellers from submitting invoices", async function () {
                const hash = "0x" + "44".repeat(32);
                // Test unauthorized user
                await assert.rejects(
                    async () => {
                        await invoiceValidation.write.submitInvoice([hash, 100n, 190n], { account: unauthorizedClient.account });
                    },
                    /not registered seller/
                );
                // Test bank (who is registered but not as a seller)
                await assert.rejects(
                    async () => {
                        await invoiceValidation.write.submitInvoice([hash, 100n, 190n], { account: bankClient.account });
                    },
                    /not registered seller/
                );
            });
        });

        describe("PaymentRegistry Access Control", async function () {
            it("Should REJECT non-banks from storing payments", async function () {
                const invHash = "0x" + "ab".repeat(32); // Use existing invoice from previous tests
                const payHash = "0x" + "55".repeat(32);

                // Test unauthorized user
                await assert.rejects(
                    async () => {
                        await paymentRegistry.write.storePayment([payHash, invHash, 100n], { account: unauthorizedClient.account });
                    },
                    /not registered bank/
                );
                // Test seller (who is registered but not as a bank)
                await assert.rejects(
                    async () => {
                        await paymentRegistry.write.storePayment([payHash, invHash, 100n], { account: sellerClient.account });
                    },
                    /not registered bank/
                );
            });
        });
    });
});
