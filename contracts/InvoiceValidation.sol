// SPDX-License-Identifier: MIT

// InvoiceValidation.sol
// Stores invoice hashes and metadata. Only SELLER_ROLE can submit.

pragma solidity ^0.8.19;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IRegistry {
    function isSeller(address) external view returns (bool);
}

contract InvoiceValidation {
    using ECDSA for bytes32;

    IRegistry public registry;
    uint256 public invoiceCounter;

    struct Invoice {
        uint256 id;
        address seller;
        bytes32 invoiceHash; // e.g., keccak256(file)
        uint256 amount; // in cents
        uint256 timestamp;
    }

    mapping(uint256 => Invoice) public invoices;
    mapping(bytes32 => uint256) public hashToId;

    event InvoiceStored(uint256 indexed id, address indexed seller, bytes32 hash, uint256 amount);

    constructor(address registryAddr) {
        registry = IRegistry(registryAddr);
    }

    // Seller submits invoice (could include seller signature for additional proof)
    function submitInvoice(bytes32 invoiceHash, uint256 amount) external returns (uint256) {
        require(registry.isSeller(msg.sender), "not registered seller");
        require(hashToId[invoiceHash] == 0, "already stored");

        invoiceCounter++;
        invoices[invoiceCounter] = Invoice(invoiceCounter, msg.sender, invoiceHash, amount, block.timestamp);
        hashToId[invoiceHash] = invoiceCounter;

        emit InvoiceStored(invoiceCounter, msg.sender, invoiceHash, amount);
        return invoiceCounter;
    }

    function getInvoiceIdByHash(bytes32 h) external view returns (uint256) {
        return hashToId[h];
    }
}
