// Imports must be at the top
import SwapABI from './abis/Swap.json'; // Path to your Swap ABI
import TokenABI from './abis/Moonswap.json'; // Path to your Token ABI

// Environment variables for contract addresses
export const SWAP_ADDRESS = process.env.REACT_APP_SWAP_ADDRESS;
export const TOKEN_ADDRESS = process.env.REACT_APP_TOKEN_ADDRESS;

// ABIs for the contracts
export const SWAP_ABI = SwapABI;
export const TOKEN_ABI = TokenABI;
