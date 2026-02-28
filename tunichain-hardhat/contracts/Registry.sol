// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// Registry contract (roles + membership)
contract Registry is AccessControl {
    bytes32 public constant TAX_ADMIN = keccak256("TAX_ADMIN");
    bytes32 public constant SELLER_ROLE = keccak256("SELLER_ROLE");
    bytes32 public constant BANK_ROLE = keccak256("BANK_ROLE");

    struct Entity {
        address addr;
        string meta; // optional metadata (IPFS CID, name, tax id)
        bool active;
    }

    mapping(address => Entity) public sellers;
    mapping(address => Entity) public banks;

    event SellerAdded(address indexed seller, string meta);
    event SellerRemoved(address indexed seller);
    event BankAdded(address indexed bank, string meta);
    event BankRemoved(address indexed bank);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TAX_ADMIN, admin);
    }

    // Tax admin calls
    function addSeller(address seller, string calldata meta) external onlyRole(TAX_ADMIN) {
        sellers[seller] = Entity(seller, meta, true);
        _grantRole(SELLER_ROLE, seller);
        emit SellerAdded(seller, meta);
    }

    function removeSeller(address seller) external onlyRole(TAX_ADMIN) {
        sellers[seller].active = false;
        _revokeRole(SELLER_ROLE, seller);
        emit SellerRemoved(seller);
    }

    function addBank(address bank, string calldata meta) external onlyRole(TAX_ADMIN) {
        banks[bank] = Entity(bank, meta, true);
        _grantRole(BANK_ROLE, bank);
        emit BankAdded(bank, meta);
    }

    function removeBank(address bank) external onlyRole(TAX_ADMIN) {
        banks[bank].active = false;
        _revokeRole(BANK_ROLE, bank);
        emit BankRemoved(bank);
    }

    // helpers
    function isSeller(address a) external view returns (bool) {
        return hasRole(SELLER_ROLE, a) && sellers[a].active;
    }
    function isBank(address a) external view returns (bool) {
        return hasRole(BANK_ROLE, a) && banks[a].active;
    }
}
