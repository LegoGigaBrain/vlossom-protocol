// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing purposes
 * @dev Simple ERC20 with public mint function and 6 decimals to match real USDC
 */
contract MockUSDC is ERC20 {
    /**
     * @notice Initialize the mock USDC token
     */
    constructor() ERC20("Mock USD Coin", "USDC") {}

    /**
     * @notice Override decimals to match real USDC (6 decimals)
     * @return Number of decimals
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Mint tokens to any address (for testing only)
     * @param to Address to receive minted tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
