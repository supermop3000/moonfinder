import { ethers } from 'ethers';
import { SWAP_ADDRESS, SWAP_ABI } from '../config';

export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return null;
    }

    // Create a Web3 provider and request accounts
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Request MetaMask to unlock and connect account(s)
    await provider.send('eth_requestAccounts', []); // This opens the MetaMask prompt

    const signer = provider.getSigner();
    const address = await signer.getAddress();

    // Connect to the Swap contract
    const swapContract = new ethers.Contract(SWAP_ADDRESS, SWAP_ABI, signer);

    return { provider, signer, swapContract, address };
  } catch (error) {
    if (error.code === 4001) {
      // User rejected the connection
      alert('Wallet connection rejected.');
    } else {
      console.error('An unexpected error occurred:', error);
    }
    return null; // Indicate connection failure
  }
};
