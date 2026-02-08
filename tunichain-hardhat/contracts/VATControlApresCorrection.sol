// SPDX-License-Identifier: MIT

// VATControl.sol
// Simple incremental bookkeeping example — can be more advanced
pragma solidity ^0.8.20;

struct Invoice {
    uint256 id;
    address seller;
    bytes32 invoiceHash; // e.g., keccak256(file)
    uint256 amount; // in millimes
    uint256 vatRatePermille;
    uint256 timestamp;
}

struct Payment {
    uint256 id;
    address bank;
    uint256 invoiceId;
    bytes32 paymentHash; // hash of payment receipt file
    uint256 amountPaid;
    uint256 timestamp;
}

interface IInvoiceMinimal {
    function invoices(uint256) external view returns (Invoice memory);
}

interface IPaymentMinimal {
    function payments(uint256) external view returns (Payment memory);
}

contract VATControl {
    IInvoiceMinimal public invoiceReg;
    IPaymentMinimal public paymentReg;

    // seller => total taxable base (in cents)
    mapping(address => uint256) public sellerTaxBase;
    mapping(address => uint256) public sellerVatPaid; // if payments include VAT amount
    mapping(address => uint256) public sellerVatOwed; // total VAT owed based on recorded invoices

    uint256 public vatRatePermille = 190; // e.g., 190 = 19.0% => store per-mille or basis points

    // Events for off-chain monitoring
    event VATRecorded(
        address indexed seller,
        uint256 indexed invoiceId,
        uint256 taxableAmount,
        uint256 vatRatePermille,
        uint256 vatAmount,
        uint256 sellerTotalTaxBase,
        uint256 timestamp
    );
    event VATPaymentRecorded(
        address indexed seller,
        uint256 indexed paymentId,
        uint256 indexed invoiceId,
        uint256 amountPaid,
        uint256 vatRatePermille,
        uint256 vatAmount,
        uint256 sellerTotalVatPaid,
        uint256 timestamp
    );
    event VATRateUpdated(uint256 oldRate, uint256 newRate, uint256 timestamp);

    constructor(address invoiceAddr, address paymentAddr) {
        invoiceReg = IInvoiceMinimal(invoiceAddr);
        paymentReg = IPaymentMinimal(paymentAddr);
    }

    // Called by a trusted system off-chain or by the InvoiceRegistry when invoice is stored.
    function recordInvoiceTax(uint256 invoiceId) external {
        Invoice memory inv = invoiceReg.invoices(invoiceId);
        address seller = inv.seller;
        uint256 amount = inv.amount;
        uint256 invoiceVatRatePermille = inv.vatRatePermille;

        uint256 vat = (amount * invoiceVatRatePermille) / 1000;
        sellerTaxBase[seller] += amount;
        sellerVatOwed[seller] += vat;
        // Do not auto-credit as paid; payments recorded separately.
        emit VATRecorded(
            seller,
            invoiceId,
            amount,
            invoiceVatRatePermille,
            vat,
            sellerTaxBase[seller],
            block.timestamp
        );
    }

    // Optionally, call when a payment is recorded (match payment->invoice then mark VAT as paid)
    function recordPayment(uint256 paymentId) external {
        Payment memory payment = paymentReg.payments(paymentId);
        uint256 invoiceId = payment.invoiceId;
        uint256 amountPaid = payment.amountPaid;

        Invoice memory inv = invoiceReg.invoices(payment.invoiceId);
        address seller = inv.seller;
        uint256 invoiceAmount = inv.amount; // or whatever the field is called
        uint256 invoiceVatRatePermille = inv.vatRatePermille;
        uint256 vat = (invoiceAmount * invoiceVatRatePermille) / 1000;
        
        // business logic: determine how much of amountPaid is VAT portion
        sellerVatPaid[seller] += vat;
        emit VATPaymentRecorded(
            seller,
            paymentId,
            invoiceId,
            amountPaid,
            invoiceVatRatePermille,
            vat,
            sellerVatPaid[seller],
            block.timestamp
        );
    }

    // admin function to set vat rate
    function setVatRatePermille(uint256 r) external {
        // protect with permission: omitted for brevity — integrate with Registry or Ownable
        uint256 oldRate = vatRatePermille;
        vatRatePermille = r;
        emit VATRateUpdated(oldRate, r, block.timestamp);
    }

    // View function to get seller's VAT totals
    function getSellerVATTotals(
        address seller
    )
        external
        view
        returns (
            uint256 totalTaxBase,
            uint256 totalVatPaid,
            uint256 totalVatOwed
        )
    {
        totalTaxBase = sellerTaxBase[seller];
        totalVatPaid = sellerVatPaid[seller];
        // VAT owed accumulated from recorded invoices (net amount model)
        totalVatOwed = sellerVatOwed[seller];
    }

    // View function to get the difference between VAT owed and VAT paid (outstanding VAT)
    function getSellerVATOutstanding(
        address seller
    ) external view returns (uint256 outstandingVat) {
        uint256 owed = sellerVatOwed[seller];
        uint256 paid = sellerVatPaid[seller];
        if (owed > paid) {
            outstandingVat = owed - paid;
        } else {
            outstandingVat = 0;
        }
    }
}
