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

const OperationBase = require('./utils/operation-base');
const TunichainState = require('./utils/tunichain-state');
const crypto = require('crypto');
const path = require('path');

/**
 * Workload module for storing payments in the PaymentRegistry contract.
 */
class StorePayment extends OperationBase {

    /**
     * Initializes the parameters of the workload.
     */
    constructor() {
        super();
        this.invoiceHashes = [];
    }

    /**
     * Initialize the workload module with the given parameters.
     * @param {number} workerIndex The 0-based index of the worker instantiating the workload module.
     * @param {number} totalWorkers The total number of workers participating in the round.
     * @param {number} roundIndex The 0-based index of the currently executing round.
     * @param {Object} roundArguments The user-provided arguments for the round from the benchmark configuration file.
     * @param {ConnectorBase} sutAdapter The adapter of the underlying SUT.
     * @param {Object} sutContext The custom context object provided by the SUT adapter.
     * @async
     */
    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        // Get the number of invoices that were created in the submitInvoice round
        // These should be passed via roundArguments or we generate matching ones
        this.numberOfInvoices = roundArguments.numberOfInvoices || 100;

        // Pre-generate invoice hashes that match what would have been created
        // This assumes the same hash generation pattern as TunichainState
        // LOAD STATE FROM FILE instead of guessing
        const statePath = path.resolve(__dirname, 'tunichain-state.json');
        console.log(`Loading state from ${statePath}...`);
        this.tunichainState.loadState(statePath);

        if (this.tunichainState.createdInvoices.length > 0) {
            this.invoiceHashes = this.tunichainState.createdInvoices.map(i => i.hash);
            console.log(`Loaded ${this.invoiceHashes.length} invoices from state.`);
        } else {
            console.warn('No invoices loaded from state. Fallback to random generation (will likely fail).');
            for (let i = 1; i <= this.numberOfInvoices; i++) {
                const data = `invoice-${this.workerIndex}-${i}-${Date.now()}`;
                const hash = crypto.createHash('sha256').update(data).digest('hex');
                this.invoiceHashes.push('0x' + hash);
            }
        }

        this.paymentCounter = 0;

        // Register this worker as a bank if not already
        // We assume the caller (admin) has TAX_ADMIN role to add banks
        try {
            console.log(`Worker ${workerIndex}: Registering as bank...`);
            const request = this.createConnectorRequest(
                'registry',
                'addBank',
                [this.sutContext.fromAddress, `Bank-Worker-${workerIndex}`],
                false
            );
            await this.sutAdapter.sendRequests(request);
            console.log(`Worker ${workerIndex}: Registered as bank.`);
        } catch (error) {
            console.log(`Worker ${workerIndex}: Warning during bank registration: ${error.message}`);
        }
    }

    /**
     * Create a TunichainState instance.
     * @param {number} roundIndex The round index.
     * @return {TunichainState} The state instance.
     */
    createTunichainState(roundIndex) {
        return new TunichainState(this.workerIndex, roundIndex);
    }

    /**
     * Generate a unique payment hash.
     * @returns {string} A bytes32 hash string.
     * @private
     */
    _generatePaymentHash() {
        this.paymentCounter++;
        const data = `payment-${this.workerIndex}-${this.paymentCounter}-${Date.now()}`;
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        return '0x' + hash;
    }

    /**
     * Assemble TXs for storing payments.
     */
    async submitTransaction() {
        // Generate unique payment hash
        const paymentHash = this._generatePaymentHash();

        // Select a random invoice hash from our pool
        const invoiceHash = this.invoiceHashes[Math.floor(Math.random() * this.invoiceHashes.length)];

        // Generate a random payment amount
        const amountPaid = Math.floor(Math.random() * 1000000) + 100000;

        const request = this.createConnectorRequest(
            'paymentRegistry',
            'storePayment',
            [paymentHash, invoiceHash, amountPaid],
            false
        );
        await this.sutAdapter.sendRequests(request);
    }
}

/**
 * Create a new instance of the workload module.
 * @return {WorkloadModuleInterface}
 */
function createWorkloadModule() {
    return new StorePayment();
}

module.exports.createWorkloadModule = createWorkloadModule;
