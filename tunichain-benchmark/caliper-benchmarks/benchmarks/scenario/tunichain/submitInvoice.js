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
const path = require('path');

/**
 * Workload module for submitting invoices to the InvoiceValidation contract.
 */
class SubmitInvoice extends OperationBase {

    /**
     * Initializes the parameters of the workload.
     */
    constructor() {
        super();
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

        // Get optional parameters from config
        this.minAmount = roundArguments.minAmount || 100000;
        this.maxAmount = roundArguments.maxAmount || 10000000;
        this.vatRatePermille = roundArguments.vatRatePermille || 190;

        // Register this worker as a seller if not already
        // We assume the caller (admin) has TAX_ADMIN role to add sellers
        try {
            console.log(`Worker ${workerIndex}: Registering as seller...`);
            const request = this.createConnectorRequest(
                'registry',
                'addSeller',
                [this.sutContext.fromAddress, `Seller-Worker-${workerIndex}`],
                false
            );
            await this.sutAdapter.sendRequests(request);
            console.log(`Worker ${workerIndex}: Registered as seller.`);
        } catch (error) {
            // Ignore if already registered or other non-critical errors (might be race condition if multiple workers use same account)
            console.log(`Worker ${workerIndex}: Warning during seller registration: ${error.message}`);
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
     * Assemble TXs for submitting invoices.
     */
    async submitTransaction() {
        const args = this.tunichainState.getSubmitInvoiceArguments(
            this.minAmount,
            this.maxAmount,
            this.vatRatePermille
        );
        const request = this.createConnectorRequest(
            'invoiceValidation',
            'submitInvoice',
            [args.invoiceHash, args.amount, args.vatRatePermille],
            false
        );
        await this.sutAdapter.sendRequests(request);
    }

    /**
     * Cleanup the workload module at the end of the round.
     * @async
     */
    async cleanupWorkloadModule() {
        // Save state to file for next rounds
        const statePath = path.resolve(__dirname, 'tunichain-state.json');
        console.log(`Saving state to ${statePath}...`);
        this.tunichainState.saveState(statePath);
        await super.cleanupWorkloadModule();
    }
}

/**
 * Create a new instance of the workload module.
 * @return {WorkloadModuleInterface}
 */
function createWorkloadModule() {
    return new SubmitInvoice();
}

module.exports.createWorkloadModule = createWorkloadModule;
