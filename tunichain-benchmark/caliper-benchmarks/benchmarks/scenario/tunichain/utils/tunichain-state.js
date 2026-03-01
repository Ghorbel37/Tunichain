/*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Class for managing Tunichain state across benchmark rounds.
 */
class TunichainState {

    /**
     * Initializes the instance.
     * @param {number} workerIndex The worker index for unique generation.
     */
    constructor(workerIndex, roundIndex = 0) {
        this.workerIndex = workerIndex;
        this.roundIndex = roundIndex;
        this.sellerCounter = 0;
        this.bankCounter = 0;
        this.invoiceCounter = 0;
        this.paymentCounter = 0;

        // Track registered entities for dependent operations
        this.registeredSellers = [];
        this.registeredBanks = [];
        this.createdInvoices = []; // Stores { hash, id } for payment linking
    }

    /**
     * Generate a deterministic Ethereum address based on worker index, round index and counter.
     * @param {string} prefix A prefix to differentiate entity types.
     * @param {number} counter The counter value.
     * @returns {string} A valid Ethereum address.
     * @private
     */
    _generateAddress(prefix, counter) {
        const data = `${prefix}-${this.workerIndex}-${this.roundIndex}-${counter}`;
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        return '0x' + hash.substring(0, 40);
    }

    /**
     * Generate a keccak256-like hash for invoices/payments.
     * @param {string} prefix A prefix to differentiate hash types.
     * @param {number} counter The counter value.
     * @returns {string} A bytes32 hash string.
     * @private
     */
    _generateHash(prefix, counter) {
        const data = `${prefix}-${this.workerIndex}-${this.roundIndex}-${counter}-${Date.now()}`;
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        return '0x' + hash;
    }

    /**
     * Get the arguments for adding a new seller.
     * @returns {object} The seller arguments { address, meta }.
     */
    getAddSellerArguments() {
        this.sellerCounter++;
        const address = this._generateAddress('seller', this.sellerCounter);
        const meta = `Seller-${this.workerIndex}-${this.sellerCounter}`;

        // Track for later use
        this.registeredSellers.push(address);

        return {
            address: address,
            meta: meta
        };
    }

    /**
     * Get the arguments for adding a new bank.
     * @returns {object} The bank arguments { address, meta }.
     */
    getAddBankArguments() {
        this.bankCounter++;
        const address = this._generateAddress('bank', this.bankCounter);
        const meta = `Bank-${this.workerIndex}-${this.bankCounter}`;

        // Track for later use
        this.registeredBanks.push(address);

        return {
            address: address,
            meta: meta
        };
    }

    /**
     * Get the arguments for submitting a new invoice.
     * @param {number} minAmount Minimum invoice amount in millimes.
     * @param {number} maxAmount Maximum invoice amount in millimes.
     * @param {number} vatRatePermille VAT rate in per-mille (e.g., 190 = 19%).
     * @returns {object} The invoice arguments { invoiceHash, amount, vatRatePermille }.
     */
    getSubmitInvoiceArguments(minAmount = 100000, maxAmount = 10000000, vatRatePermille = 190) {
        this.invoiceCounter++;
        const invoiceHash = this._generateHash('invoice', this.invoiceCounter);
        const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

        // Track for payment linking
        this.createdInvoices.push({
            hash: invoiceHash,
            expectedId: this.invoiceCounter
        });

        return {
            invoiceHash: invoiceHash,
            amount: amount,
            vatRatePermille: vatRatePermille
        };
    }

    /**
     * Get the arguments for storing a new payment.
     * @param {number} invoiceIndex Optional specific invoice index to pay. If not provided, uses a random one.
     * @returns {object} The payment arguments { paymentHash, invoiceHash, amountPaid }.
     */
    getStorePaymentArguments(invoiceIndex = null) {
        if (this.createdInvoices.length === 0) {
            throw new Error('No invoices available for payment. Run submitInvoice round first.');
        }

        this.paymentCounter++;
        const paymentHash = this._generateHash('payment', this.paymentCounter);

        // Select an invoice to pay
        const idx = invoiceIndex !== null
            ? invoiceIndex
            : Math.floor(Math.random() * this.createdInvoices.length);
        const invoice = this.createdInvoices[idx % this.createdInvoices.length];

        // Generate a payment amount (could be partial or full)
        const amountPaid = Math.floor(Math.random() * 1000000) + 100000;

        return {
            paymentHash: paymentHash,
            invoiceHash: invoice.hash,
            amountPaid: amountPaid
        };
    }

    /**
     * Get a random registered seller address.
     * @returns {string} A seller address.
     */
    getRandomSeller() {
        if (this.registeredSellers.length === 0) {
            throw new Error('No sellers registered. Run addSeller round first.');
        }
        return this.registeredSellers[Math.floor(Math.random() * this.registeredSellers.length)];
    }

    /**
     * Get a random registered bank address.
     * @returns {string} A bank address.
     */
    getRandomBank() {
        if (this.registeredBanks.length === 0) {
            throw new Error('No banks registered. Run addBank round first.');
        }
        return this.registeredBanks[Math.floor(Math.random() * this.registeredBanks.length)];
    }

    /**
     * Save the current state to a file.
     * @param {string} filePath The path to the file.
     */
    saveState(filePath) {
        const state = {
            createdInvoices: this.createdInvoices
        };
        fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
    }

    /**
     * Load state from a file.
     * @param {string} filePath The path to the file.
     */
    loadState(filePath) {
        if (fs.existsSync(filePath)) {
            const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (state.createdInvoices) {
                this.createdInvoices = state.createdInvoices;
                // Update counter to avoid collisions if we continue generating
                this.invoiceCounter = this.createdInvoices.length;
            }
        }
    }
}

module.exports = TunichainState;
