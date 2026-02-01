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

    // ============================================
    // ADVANCED SECURITY TESTS
    // ============================================

    describe("Advanced Security Tests", async function () {
        describe("Role Revocation", async function () {
            it("Should REJECT revoked seller from submitting invoices", async function () {
                // Create and add a temporary seller
                const tempSellerClient = walletClients[4];
                const tempSellerAddress = tempSellerClient.account.address;
                await registry.write.addSeller([tempSellerAddress, "Temp Seller"]);

                // Verify seller can submit invoice
                const hash1 = "0x" + "f1".repeat(32);
                await invoiceValidation.write.submitInvoice(
                    [hash1, 100000n, 190n],
                    { account: tempSellerClient.account }
                );

                // Revoke the seller
                await registry.write.removeSeller([tempSellerAddress]);

                // Verify revoked seller cannot submit invoices
                const hash2 = "0x" + "f2".repeat(32);
                await assert.rejects(
                    async () => {
                        await invoiceValidation.write.submitInvoice(
                            [hash2, 100000n, 190n],
                            { account: tempSellerClient.account }
                        );
                    },
                    /not registered seller/
                );
            });

            it("Should REJECT revoked bank from storing payments", async function () {
                // Create and add a temporary bank
                const tempBankClient = walletClients[5];
                const tempBankAddress = tempBankClient.account.address;
                await registry.write.addBank([tempBankAddress, "Temp Bank"]);

                // Create an invoice for the payment
                const invHash = "0x" + "f3".repeat(32);
                await invoiceValidation.write.submitInvoice(
                    [invHash, 100000n, 190n],
                    { account: sellerClient.account }
                );

                // Verify bank can store payment
                const payHash1 = "0x" + "f4".repeat(32);
                await paymentRegistry.write.storePayment(
                    [payHash1, invHash, 119000n],
                    { account: tempBankClient.account }
                );

                // Revoke the bank
                await registry.write.removeBank([tempBankAddress]);

                // Create another invoice
                const invHash2 = "0x" + "f5".repeat(32);
                await invoiceValidation.write.submitInvoice(
                    [invHash2, 100000n, 190n],
                    { account: sellerClient.account }
                );

                // Verify revoked bank cannot store payments
                const payHash2 = "0x" + "f6".repeat(32);
                await assert.rejects(
                    async () => {
                        await paymentRegistry.write.storePayment(
                            [payHash2, invHash2, 119000n],
                            { account: tempBankClient.account }
                        );
                    },
                    /not registered bank/
                );
            });
        });

        describe("Duplicate Prevention", async function () {
            it("Should REJECT duplicate invoice hash", async function () {
                const hash = "0x" + "d1".repeat(32);
                await invoiceValidation.write.submitInvoice(
                    [hash, 100000n, 190n],
                    { account: sellerClient.account }
                );

                await assert.rejects(
                    async () => {
                        await invoiceValidation.write.submitInvoice(
                            [hash, 200000n, 190n],
                            { account: sellerClient.account }
                        );
                    },
                    /already stored/
                );
            });

            it("Should REJECT duplicate payment hash", async function () {
                // Create an invoice
                const invHash = "0x" + "d2".repeat(32);
                await invoiceValidation.write.submitInvoice(
                    [invHash, 100000n, 190n],
                    { account: sellerClient.account }
                );

                const payHash = "0x" + "d3".repeat(32);
                await paymentRegistry.write.storePayment(
                    [payHash, invHash, 119000n],
                    { account: bankClient.account }
                );

                // Create another invoice for second payment attempt
                const invHash2 = "0x" + "d4".repeat(32);
                await invoiceValidation.write.submitInvoice(
                    [invHash2, 100000n, 190n],
                    { account: sellerClient.account }
                );

                await assert.rejects(
                    async () => {
                        await paymentRegistry.write.storePayment(
                            [payHash, invHash2, 119000n],
                            { account: bankClient.account }
                        );
                    },
                    /payment exists/
                );
            });

            it("Should REJECT payment for unknown invoice hash", async function () {
                const unknownInvHash = "0x" + "d5".repeat(32);
                const payHash = "0x" + "d6".repeat(32);

                await assert.rejects(
                    async () => {
                        await paymentRegistry.write.storePayment(
                            [payHash, unknownInvHash, 119000n],
                            { account: bankClient.account }
                        );
                    },
                    /invoice unknown/
                );
            });
        });

        describe("Admin-Only Functions", async function () {
            it("Should REJECT non-admin from calling setVATControl on InvoiceValidation", async function () {
                await assert.rejects(
                    async () => {
                        await invoiceValidation.write.setVATControl(
                            [vatControl.address],
                            { account: unauthorizedClient.account }
                        );
                    },
                    /only admin/
                );
            });

            it("Should REJECT non-admin from calling setVATControl on PaymentRegistry", async function () {
                await assert.rejects(
                    async () => {
                        await paymentRegistry.write.setVATControl(
                            [vatControl.address],
                            { account: unauthorizedClient.account }
                        );
                    },
                    /only admin/
                );
            });
        });

        describe("Edge Cases", async function () {
            it("Should handle zero amount invoice", async function () {
                const hash = "0x" + "e1".repeat(32);

                // This should succeed (contract allows zero amount)
                const txHash = await invoiceValidation.write.submitInvoice(
                    [hash, 0n, 190n],
                    { account: sellerClient.account }
                );
                const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

                assert.ok(receipt.status === "success", "Zero amount invoice should be accepted");

                const invId = await invoiceValidation.read.getInvoiceIdByHash([hash]);
                assert.ok(invId > 0n, "Invoice should be stored");
            });

            it("Should handle empty metadata for seller", async function () {
                const addr = "0x9999999999999999999999999999999999999999";

                const txHash = await registry.write.addSeller([addr, ""]);
                const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

                assert.ok(receipt.status === "success", "Empty metadata should be accepted");

                const isSeller = await registry.read.isSeller([addr]);
                assert.ok(isSeller, "Seller with empty metadata should be active");
            });
        });
    });

    // ============================================
    // EVENT VERIFICATION TESTS
    // ============================================

    describe("Event Verification Tests", async function () {
        describe("Registry Events", async function () {
            it("Should emit SellerAdded event with correct parameters", async function () {
                const sellerAddr = "0x7777777777777777777777777777777777777777";
                const metadata = "Test Seller Metadata";

                const txHash = await registry.write.addSeller([sellerAddr, metadata]);
                const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

                const logs = await publicClient.getContractEvents({
                    address: registry.address,
                    abi: registry.abi,
                    eventName: "SellerAdded",
                    fromBlock: receipt.blockNumber,
                    toBlock: receipt.blockNumber,
                    strict: true,
                });

                assert.equal(logs.length, 1, "Should emit exactly one SellerAdded event");
                assert.equal(logs[0].args.seller, sellerAddr, "Event seller address should match");
                assert.equal(logs[0].args.meta, metadata, "Event metadata should match");
            });

            it("Should emit BankAdded event with correct parameters", async function () {
                const bankAddr = "0x8888888888888888888888888888888888888888";
                const metadata = "Test Bank Metadata";

                const txHash = await registry.write.addBank([bankAddr, metadata]);
                const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

                const logs = await publicClient.getContractEvents({
                    address: registry.address,
                    abi: registry.abi,
                    eventName: "BankAdded",
                    fromBlock: receipt.blockNumber,
                    toBlock: receipt.blockNumber,
                    strict: true,
                });

                assert.equal(logs.length, 1, "Should emit exactly one BankAdded event");
                assert.equal(logs[0].args.bank, bankAddr, "Event bank address should match");
                assert.equal(logs[0].args.meta, metadata, "Event metadata should match");
            });
        });

        describe("InvoiceValidation Events", async function () {
            it("Should emit InvoiceStored event with correct parameters", async function () {
                const invoiceHash = "0x" + "aa".repeat(32);
                const amount = 2000000n;
                const vatRate = 190n;
                const expectedVat = (amount * vatRate) / 1000n;

                const txHash = await invoiceValidation.write.submitInvoice(
                    [invoiceHash, amount, vatRate],
                    { account: sellerClient.account }
                );
                const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

                const logs = await publicClient.getContractEvents({
                    address: invoiceValidation.address,
                    abi: invoiceValidation.abi,
                    eventName: "InvoiceStored",
                    fromBlock: receipt.blockNumber,
                    toBlock: receipt.blockNumber,
                    strict: true,
                });

                assert.equal(logs.length, 1, "Should emit exactly one InvoiceStored event");
                assert.ok(logs[0].args.id > 0n, "Event should have valid invoice ID");
                assert.equal(logs[0].args.seller.toLowerCase(), sellerAddress.toLowerCase(), "Event seller should match");
                assert.equal(logs[0].args.hash, invoiceHash, "Event hash should match");
                assert.equal(logs[0].args.amount, amount, "Event amount should match");
                assert.equal(logs[0].args.vatRatePermille, vatRate, "Event VAT rate should match");
                assert.equal(logs[0].args.vatAmount, expectedVat, "Event VAT amount should be calculated correctly");
            });
        });

        describe("PaymentRegistry Events", async function () {
            it("Should emit PaymentStored event with correct parameters", async function () {
                // First create an invoice
                const invoiceHash = "0x" + "bb".repeat(32);
                await invoiceValidation.write.submitInvoice(
                    [invoiceHash, 1500000n, 190n],
                    { account: sellerClient.account }
                );

                const paymentHash = "0x" + "cc".repeat(32);
                const amountPaid = 1785000n;

                const txHash = await paymentRegistry.write.storePayment(
                    [paymentHash, invoiceHash, amountPaid],
                    { account: bankClient.account }
                );
                const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

                const logs = await publicClient.getContractEvents({
                    address: paymentRegistry.address,
                    abi: paymentRegistry.abi,
                    eventName: "PaymentStored",
                    fromBlock: receipt.blockNumber,
                    toBlock: receipt.blockNumber,
                    strict: true,
                });

                assert.equal(logs.length, 1, "Should emit exactly one PaymentStored event");
                assert.ok(logs[0].args.id > 0n, "Event should have valid payment ID");
                assert.equal(logs[0].args.bank.toLowerCase(), bankAddress.toLowerCase(), "Event bank should match");
                assert.ok(logs[0].args.invoiceId > 0n, "Event should reference valid invoice ID");
                assert.equal(logs[0].args.paymentHash, paymentHash, "Event payment hash should match");
                assert.equal(logs[0].args.amountPaid, amountPaid, "Event amount paid should match");
            });
        });

        describe("VATControl Events", async function () {
            it("Should emit VATRecorded event when invoice is submitted with correct parameters", async function () {
                const invoiceHash = "0x" + "dd".repeat(32);
                const amount = 3000000n;
                const vatRate = 190n;
                const expectedVat = (amount * vatRate) / 1000n;

                const txHash = await invoiceValidation.write.submitInvoice(
                    [invoiceHash, amount, vatRate],
                    { account: sellerClient.account }
                );
                const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

                const logs = await publicClient.getContractEvents({
                    address: vatControl.address,
                    abi: vatControl.abi,
                    eventName: "VATRecorded",
                    fromBlock: receipt.blockNumber,
                    toBlock: receipt.blockNumber,
                    strict: true,
                });

                assert.equal(logs.length, 1, "Should emit exactly one VATRecorded event");
                assert.equal(logs[0].args.seller.toLowerCase(), sellerAddress.toLowerCase(), "Event seller should match");
                assert.ok(logs[0].args.invoiceId > 0n, "Event should have valid invoice ID");
                assert.equal(logs[0].args.taxableAmount, amount, "Event taxable amount should match");
                assert.equal(logs[0].args.vatRatePermille, vatRate, "Event VAT rate should match");
                assert.equal(logs[0].args.vatAmount, expectedVat, "Event VAT amount should be calculated correctly");
                assert.ok(logs[0].args.sellerTotalTaxBase >= amount, "Event should track cumulative tax base");
                assert.ok(logs[0].args.timestamp > 0n, "Event should have valid timestamp");
            });

            it("Should emit VATPaymentRecorded event when payment is stored with correct parameters", async function () {
                // First create an invoice
                const invoiceHash = "0x" + "ee".repeat(32);
                const amount = 2500000n;
                const vatRate = 190n;
                const expectedVat = (amount * vatRate) / 1000n;

                await invoiceValidation.write.submitInvoice(
                    [invoiceHash, amount, vatRate],
                    { account: sellerClient.account }
                );

                const paymentHash = "0x" + "ff".repeat(32);
                const amountPaid = amount + expectedVat;

                const txHash = await paymentRegistry.write.storePayment(
                    [paymentHash, invoiceHash, amountPaid],
                    { account: bankClient.account }
                );
                const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

                const logs = await publicClient.getContractEvents({
                    address: vatControl.address,
                    abi: vatControl.abi,
                    eventName: "VATPaymentRecorded",
                    fromBlock: receipt.blockNumber,
                    toBlock: receipt.blockNumber,
                    strict: true,
                });

                assert.equal(logs.length, 1, "Should emit exactly one VATPaymentRecorded event");
                assert.equal(logs[0].args.seller.toLowerCase(), sellerAddress.toLowerCase(), "Event seller should match");
                assert.ok(logs[0].args.paymentId > 0n, "Event should have valid payment ID");
                assert.ok(logs[0].args.invoiceId > 0n, "Event should have valid invoice ID");
                assert.equal(logs[0].args.amountPaid, amountPaid, "Event amount paid should match");
                assert.equal(logs[0].args.vatRatePermille, vatRate, "Event VAT rate should match");
                assert.equal(logs[0].args.vatAmount, expectedVat, "Event VAT amount should be calculated correctly");
                assert.ok(logs[0].args.sellerTotalVatPaid >= expectedVat, "Event should track cumulative VAT paid");
                assert.ok(logs[0].args.timestamp > 0n, "Event should have valid timestamp");
            });
        });
    });
});
// npx hardhat test .\test\Tunichain.ts