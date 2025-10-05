// SPDX-License-Identifier: MIT

// VATControl.sol
// Simple incremental bookkeeping example — can be more advanced
pragma solidity ^0.8.19;

interface IInvoiceMinimal {
    function invoices(uint256) external view returns (uint256 id, address seller, bytes32 hash, string memory, uint256 amount, uint256 timestamp);
}

interface IPaymentMinimal {
    function payments(uint256) external view returns (uint256 id, address bank, uint256 invoiceId, bytes32 paymentHash, uint256 amountPaid, uint256 timestamp);
}

contract VATControl {
    IInvoiceMinimal public invoiceReg;
    IPaymentMinimal public paymentReg;

    // seller => total taxable base (in cents)
    mapping(address => uint256) public sellerTaxBase;
    mapping(address => uint256) public sellerVatPaid; // if payments include VAT amount

    uint256 public vatRatePermille = 190; // e.g., 190 = 19.0% => store per-mille or basis points

    event VATRecorded(address indexed seller, uint256 invoiceId, uint256 taxableAmount, uint256 vatAmount);

    constructor(address invoiceAddr, address paymentAddr) {
        invoiceReg = IInvoiceMinimal(invoiceAddr);
        paymentReg = IPaymentMinimal(paymentAddr);
    }

    // Called by a trusted system off-chain or by the InvoiceRegistry when invoice is stored.
    function recordInvoiceTax(uint256 invoiceId) external {
        ( , address seller, , , uint256 amount, ) = invoiceReg.invoices(invoiceId);
        uint256 vat = amount * vatRatePermille / 1000;
        sellerTaxBase[seller] += amount;
        // Do not auto-credit as paid; payments recorded separately.
        emit VATRecorded(seller, invoiceId, amount, vat);
    }

    // Optionally, call when a payment is recorded (match payment->invoice then mark VAT as paid)
    function recordPayment(uint256 paymentId) external {
        ( , , uint256 invoiceId, , uint256 amountPaid, ) = paymentReg.payments(paymentId);
        ( , address seller, , , uint256 invoiceAmount, ) = invoiceReg.invoices(invoiceId);
        uint256 vat = invoiceAmount * vatRatePermille / 1000;
        // business logic: determine how much of amountPaid is VAT portion
        sellerVatPaid[seller] += vat;
        // ... more bookkeeping
    }

    // admin function to set vat rate
    function setVatRatePermille(uint256 r) external {
        // protect with permission: omitted for brevity — integrate with Registry or Ownable
        vatRatePermille = r;
    }
}
