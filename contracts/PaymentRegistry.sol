// SPDX-License-Identifier: MIT

// PaymentRegistry.sol
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IRegistry {
    function isBank(address) external view returns (bool);
}

interface IInvoiceValidation {
    function getInvoiceIdByHash(bytes32 h) external view returns (uint256);
    function invoices(uint256) external view returns (uint256, address, bytes32, string memory, uint256, uint256);
}

interface IVATControl {
    function recordPayment(uint256 paymentId) external;
}

contract PaymentRegistry {
    IRegistry public registry;
    IInvoiceValidation public invoiceValidation;
    IVATControl public vatControl;
    uint256 public paymentCounter;
    address public admin;

    struct Payment {
        uint256 id;
        address bank;
        uint256 invoiceId;
        bytes32 paymentHash; // hash of payment receipt file
        uint256 amountPaid;
        uint256 timestamp;
    }

    mapping(uint256 => Payment) public payments;
    mapping(bytes32 => uint256) public paymentHashToId;

    event PaymentStored(uint256 indexed id, address indexed bank, uint256 invoiceId, bytes32 paymentHash, uint256 amountPaid);

    constructor(address registryAddr, address invoiceValidationAddr) {
        registry = IRegistry(registryAddr);
        invoiceValidation = IInvoiceValidation(invoiceValidationAddr);
        admin = msg.sender;
    }

    // Admin can set VATControl after deployment
    function setVATControl(address vatControlAddr) external {
        require(msg.sender == admin, "only admin");
        vatControl = IVATControl(vatControlAddr);
    }

    function storePayment(bytes32 paymentHash, bytes32 invoiceHash, uint256 amountPaid) external returns (uint256) {
        require(registry.isBank(msg.sender), "not registered bank");
        require(paymentHashToId[paymentHash] == 0, "payment exists");

        uint256 invId = invoiceValidation.getInvoiceIdByHash(invoiceHash);
        require(invId != 0, "invoice unknown");

        paymentCounter++;
        payments[paymentCounter] = Payment(paymentCounter, msg.sender, invId, paymentHash, amountPaid, block.timestamp);
        paymentHashToId[paymentHash] = paymentCounter;

        emit PaymentStored(paymentCounter, msg.sender, invId, paymentHash, amountPaid);
        
        // Automatically record VAT for payment
        if (address(vatControl) != address(0)) {
            vatControl.recordPayment(paymentCounter);
        }
        
        return paymentCounter;
    }
}
