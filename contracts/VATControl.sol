// SPDX-License-Identifier: MIT

// VATControl.sol
// Simple incremental bookkeeping example — can be more advanced
pragma solidity ^0.8.19;

interface IInvoiceMinimal {
    function invoices(uint256) external view returns (uint256 id, address seller, bytes32 hash, uint256 amount, uint256 timestamp);
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

    // Events for off-chain monitoring
    event VATRecorded(address indexed seller, uint256 indexed invoiceId, uint256 taxableAmount, uint256 vatAmount, uint256 sellerTotalTaxBase, uint256 timestamp);
    event VATPaymentRecorded(address indexed seller, uint256 indexed paymentId, uint256 indexed invoiceId, uint256 amountPaid, uint256 vatAmount, uint256 sellerTotalVatPaid, uint256 timestamp);
    event VATRateUpdated(uint256 oldRate, uint256 newRate, uint256 timestamp);

    constructor(address invoiceAddr, address paymentAddr) {
        invoiceReg = IInvoiceMinimal(invoiceAddr);
        paymentReg = IPaymentMinimal(paymentAddr);
    }

    // Called by a trusted system off-chain or by the InvoiceRegistry when invoice is stored.
    function recordInvoiceTax(uint256 invoiceId) external {
        ( , address seller, , uint256 amount, ) = invoiceReg.invoices(invoiceId);
        uint256 vat = amount * vatRatePermille / 1000;
        sellerTaxBase[seller] += amount;
        // Do not auto-credit as paid; payments recorded separately.
        emit VATRecorded(seller, invoiceId, amount, vat, sellerTaxBase[seller], block.timestamp);
    }

    // Optionally, call when a payment is recorded (match payment->invoice then mark VAT as paid)
    function recordPayment(uint256 paymentId) external {
        ( , , uint256 invoiceId, , uint256 amountPaid, ) = paymentReg.payments(paymentId);
        ( , address seller, , uint256 invoiceAmount, ) = invoiceReg.invoices(invoiceId);
        uint256 vat = invoiceAmount * vatRatePermille / 1000;
        // business logic: determine how much of amountPaid is VAT portion
        sellerVatPaid[seller] += vat;
        emit VATPaymentRecorded(seller, paymentId, invoiceId, amountPaid, vat, sellerVatPaid[seller], block.timestamp);
    }

    // admin function to set vat rate
    function setVatRatePermille(uint256 r) external {
        // protect with permission: omitted for brevity — integrate with Registry or Ownable
        uint256 oldRate = vatRatePermille;
        vatRatePermille = r;
        emit VATRateUpdated(oldRate, r, block.timestamp);
    }

    // View function to get seller's VAT totals
    function getSellerVATTotals(address seller) external view returns (
        uint256 totalTaxBase,
        uint256 totalVatPaid,
        uint256 totalVatOwed
    ) {
        totalTaxBase = sellerTaxBase[seller];
        totalVatPaid = sellerVatPaid[seller];
        // Calculate total VAT owed based on current rate
        totalVatOwed = (totalTaxBase * vatRatePermille) / 1000;
    }
}
