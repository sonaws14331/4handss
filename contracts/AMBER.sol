// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title AMBER (AMBR) — a fixed-supply BEP-20 compatible community token
/// @notice The owner can pause all transfers. There is no additional minting or transfer tax.
contract AMBER is ERC20Pausable, Ownable2Step {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10 ** 18;

    constructor(address treasury) ERC20("AMBER", "AMBR") Ownable(treasury) {
        _mint(treasury, INITIAL_SUPPLY);
    }

    // BEP-20 compatibility for integrations that query the owner.
    function getOwner() external view returns (address) { return owner(); }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// @dev Prevent permanently stranding holders by renouncing while paused.
    function renounceOwnership() public override onlyOwner whenNotPaused {
        super.renounceOwnership();
    }
}
