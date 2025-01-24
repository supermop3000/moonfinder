import React, { useState, useEffect } from 'react';
import { connectWallet } from '../components/ConnectWallet'; // Wallet connection logic
import '../styles/Swap.css'; // Updated styles for futuristic visuals
import { ethers } from 'ethers';
import { TOKEN_ADDRESS, TOKEN_ABI, SWAP_ADDRESS, SWAP_ABI } from '../config';
import { PiSwapDuotone } from 'react-icons/pi';

const SwapPage = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [ethBalance, setEthBalance] = useState('');
  const [mspBalance, setMspBalance] = useState('');
  const [swapAmountMSP, setSwapAmountMSP] = useState('');
  const [swapAmountETH, setSwapAmountETH] = useState('');
  const [swapRate, setSwapRate] = useState('0'); // Swap rate from contract
  const [swapFee, setSwapFee] = useState('0'); // Swap fee from contract
  const [totalSupply, setTotalSupply] = useState('0'); // Total supply of Moonswap tokens
  const [circulatingSupply, setCirculatingSupply] = useState('0'); // Total supply of Moonswap tokens
  const [totalFund, setTotalFund] = useState('0'); // Total fund in Moonswap contract
  const [totalTransactions, setTotalTransactions] = useState('0'); // Total fund in Moonswap contract
  const [totalBurned, setTotalBurned] = useState('0');
  const [fireflies, setFireflies] = useState([]); // Store firefly positions
  const [metaMaskInstalled, setMetaMaskInstalled] = useState(false); // MetaMask installed check
  const [moonswapTokenAddress, setMoonswapTokenAddress] =
    useState(TOKEN_ADDRESS);
  const [showMoonswapDetails, setShowMoonswapDetails] = useState(false); // State to control visibility of Moonswap details

  const fireflyCount = 25;

  useEffect(() => {
    // Check if MetaMask is available
    if (window.ethereum) {
      setMetaMaskInstalled(true); // MetaMask is installed
    } else {
      setMetaMaskInstalled(false); // MetaMask is not installed
    }

    // const mainContent = document.querySelector('.main-content');
    // if (mainContent) {
    //   mainContent.classList.add('main-content-swap');
    // }

    // Fetch contract data (only runs if MetaMask is available)
    // if (window.ethereum) {
    //   fetchContractData();
    // }

    if (walletAddress) {
      // If wallet is connected, use MetaMask
      fetchContractData(window.ethereum);
    } else {
      // If wallet is not connected, use Infura
      fetchContractData(null);
    }

    // Check wallet connection
    checkWalletConnection();

    // Generate fireflies' initial positions once
    const generateFireflies = () => {
      const firefliesArray = Array.from({ length: fireflyCount }).map(() => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        randomX: `${Math.random() * 2 - 1}`,
        randomY: `${Math.random() * 2 - 1}`,
        randomDelay: `${Math.random()}`,
        glowSize: `${Math.random() * 3 + 3}px`,
      }));
      setFireflies(firefliesArray);
    };

    generateFireflies();

    return () => setFireflies([]);
  }, []);

  const toggleMoonswapDetails = () => {
    setShowMoonswapDetails(!showMoonswapDetails);
  };

  const fetchContractData = async (provider) => {
    let currentProvider;
    if (provider) {
      // Use MetaMask provider
      currentProvider = new ethers.providers.Web3Provider(provider);
    } else {
      // Use Infura as fallback provider
      currentProvider = new ethers.providers.JsonRpcProvider(
        `https://sepolia.infura.io/v3/${process.env.REACT_APP_INFURA_PROJECT_ID}`
      );
    }

    try {
      // const provider = new ethers.providers.Web3Provider(currentProvider);
      const swapContract = new ethers.Contract(
        SWAP_ADDRESS,
        SWAP_ABI,
        currentProvider
      );

      const tokenContract = new ethers.Contract(
        TOKEN_ADDRESS,
        TOKEN_ABI,
        currentProvider
      );

      // Fetch swap rate and fee percentage
      const rate = await swapContract.callStatic.rate();
      const fee = await swapContract.callStatic.feePercent();
      const totalBurned = await tokenContract.getTotalBurned();
      const totalFund = await tokenContract.getTotalFeesPaidToOwner();
      const totalTransactions = await tokenContract.getTotalTransactions();
      const circulatingSupply = await tokenContract.getCirculatingSupply();
      const totalSupply = await tokenContract.totalSupply();

      console.log('Swap Rate:', ethers.utils.formatEther(rate));
      console.log('Swap Fee:', fee.toString());
      console.log('Total Burned:', ethers.utils.formatEther(totalBurned));

      setSwapRate(ethers.utils.formatEther(rate));
      setSwapFee(fee.toString());
      setTotalBurned(ethers.utils.formatEther(totalBurned));
      setTotalFund(totalFund.toString());
      setTotalTransactions(totalTransactions.toString());
      setCirculatingSupply(ethers.utils.formatEther(circulatingSupply));
      setTotalSupply(ethers.utils.formatEther(totalSupply));
    } catch (error) {
      console.error('Error fetching contract data:', error);
    }
  };

  const checkWalletConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        if (accounts.length > 0) {
          const address = accounts[0];
          setWalletAddress(address);
          fetchBalances(address);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const fetchBalances = async (address) => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        // Fetch ETH balance
        const ethBalanceRaw = await provider.getBalance(address);
        setEthBalance(ethers.utils.formatEther(ethBalanceRaw));

        // Fetch MSP balance
        const tokenContract = new ethers.Contract(
          TOKEN_ADDRESS,
          TOKEN_ABI,
          provider
        );
        const mspBalanceRaw = await tokenContract.balanceOf(address);
        setMspBalance(ethers.utils.formatEther(mspBalanceRaw));
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    }
  };

  const handleConnectWallet = async () => {
    const walletDetails = await connectWallet();
    if (walletDetails?.address) {
      setWalletAddress(walletDetails.address);
      fetchBalances(walletDetails.address);
    }
  };

  const handleMSPChange = (amountMSP) => {
    setSwapAmountMSP(amountMSP);
    const calculatedETH = (amountMSP / parseFloat(swapRate)).toFixed(10);
    setSwapAmountETH(calculatedETH);
  };

  const handleETHChange = (amountETH) => {
    setSwapAmountETH(amountETH);
    const calculatedMSP = (amountETH * parseFloat(swapRate)).toFixed(10);
    setSwapAmountMSP(calculatedMSP);
  };

  const calculateTotalCost = () => {
    const ethAmount = parseFloat(swapAmountETH || 0);
    const fee = (ethAmount * parseFloat(swapFee)) / 100;
    return (ethAmount + fee).toFixed(8);
  };

  const handleSwap = async () => {
    try {
      if (!metaMaskInstalled) {
        alert('MetaMask needs to be installed to continue.');
        return;
      }

      if (!walletAddress) {
        alert('MetaMask wallet needs to be connected to continue.');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();

      // Connect to the Swap contract
      const swapContract = new ethers.Contract(SWAP_ADDRESS, SWAP_ABI, signer);

      if (parseFloat(swapAmountMSP) > 0) {
        const ethAmount = ethers.utils.parseEther(swapAmountETH);
        const ethAmountWithFee = ethAmount * (1 + parseFloat(swapFee) / 100);

        const swapTx = await swapContract.buyMoonswap({
          value: ethAmountWithFee,
        });

        await swapTx.wait();
        alert(
          `Swapped ${ethAmountWithFee} ETH for Moonswap tokens successfully!`
        );
      } else {
        alert('Please enter an amount to swap.');
      }
    } catch (error) {
      console.error('Error executing swap:', error);
      alert('An error occurred while processing the swap.');
    }
  };

  const handleGetMetaMask = () => {
    window.open('https://metamask.io/download/', '_blank');
  };

  return (
    <div className="main-div-swap">
      {/* Fireflies */}
      <div className="fireflies-container">
        {fireflies.map((firefly, i) => (
          <div
            key={i}
            className="firefly"
            style={{
              top: firefly.top,
              left: firefly.left,
              '--random-x': firefly.randomX,
              '--random-y': firefly.randomY,
              '--random-delay': firefly.randomDelay,
            }}
          ></div>
        ))}
      </div>
      <div className="swap-page-container">
        {/* Moonswap Header */}
        {/* <div className="moonswap-header">
          <h1 className="moonswap-title">Moonswap</h1>
        </div> */}

        {/* Wallet Information */}
        <div className="wallet-info-section">
          {!metaMaskInstalled ? (
            <>
              {/* <button className="connect-wallet" onClick={handleConnectWallet}>
                Connect Wallet
              </button> */}
              <button className="get-metamask" onClick={handleGetMetaMask}>
                Get MetaMask
              </button>
            </>
          ) : !walletAddress ? (
            <>
              <button className="connect-wallet" onClick={handleConnectWallet}>
                Connect Wallet
              </button>
            </>
          ) : (
            <div className="wallet-details">
              <div className="wallet-box">
                <h3 className="wallet-heading">Connected Wallet</h3>
                <div className="wallet-address-display">
                  <div className="wallet-address-text">{walletAddress}</div>
                </div>
              </div>
              <div className="wallet-balances">
                <div className="balance-box msp-box">
                  <h3 className="wallet-token-heading">Moonswap Balance</h3>
                  <div className="balance-display">
                    <div className="wallet-address-text">
                      {mspBalance || '0'}
                    </div>
                  </div>
                </div>
                <div className="balance-box eth-box">
                  <h3 className="wallet-token-heading">Ethereum Balance</h3>
                  <div className="balance-display">
                    <div className="wallet-address-text">
                      {ethBalance || '0'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Swap Section */}
        <div className="swap-section">
          <div className="swap-boxes">
            <div className="token-box msp-box">
              <h3 className="token-heading">Moonswap</h3>
              <p className="token-symbol">MSP</p>
              <input
                type="number"
                placeholder="MSP Amount"
                value={swapAmountMSP}
                onChange={(e) => handleMSPChange(e.target.value)}
                className="swap-input"
                step="any"
              />
            </div>
            <div className="swap-icon-container">
              <PiSwapDuotone className="swap-icon" />
            </div>
            <div className="token-box eth-box">
              <h3 className="token-heading">Ethereum</h3>
              <p className="token-symbol">ETH</p>
              <input
                type="number"
                placeholder="ETH Amount"
                value={swapAmountETH}
                onChange={(e) => handleETHChange(e.target.value)}
                className="swap-input"
                step="any"
              />
            </div>
          </div>
          <div className="info-section">
            <div className="info-block">Fee: {swapFee}%</div>
            <div className="info-block total">
              Total Cost: {calculateTotalCost()} ETH
            </div>
          </div>
        </div>
        <div className="swap-button-section">
          <button className="swap-button" onClick={handleSwap}>
            Buy Moonswap
          </button>
        </div>
        {/* Moonswap Details Section */}
        {/* Moonswap Details Section */}
        <div className="moonswap-details-section">
          <h2 className="section-heading" onClick={toggleMoonswapDetails}>
            {showMoonswapDetails ? 'Moonswap Info' : 'Moonswap Info'}
          </h2>

          <div
            className={`moonswap-details ${
              showMoonswapDetails ? 'expanded' : ''
            }`}
          >
            <div className="moonswap-address-box">
              <h4 className="moonswap-heading">Token Contract</h4>
              <div className="moonswap-info-display">
                <a
                  href={`https://sepolia.etherscan.io/address/${TOKEN_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="swap-details-link"
                >
                  {TOKEN_ADDRESS}
                </a>
              </div>
            </div>
            <div className="moonswap-box">
              <h4 className="moonswap-heading">Swap Contract</h4>
              <div className="moonswap-info-display">
                <a
                  href={`https://sepolia.etherscan.io/address/${SWAP_ADDRESS}#tokentxns`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="swap-details-link"
                >
                  {SWAP_ADDRESS}
                </a>
              </div>
            </div>
            <div className="moonswap-box">
              <h4 className="moonswap-heading">Total Supply</h4>
              <div className="moonswap-info-display">
                <p>{`${totalSupply}`}</p>
              </div>
            </div>
            <div className="moonswap-box">
              <h4 className="moonswap-heading">Circulating Supply</h4>
              <div className="moonswap-info-display">
                <p>{`${circulatingSupply}`}</p>
              </div>
            </div>
            <div className="moonswap-box">
              <h4 className="moonswap-heading">Cost of Moonswap in eth</h4>
              <div className="moonswap-info-display">
                <p>{1 / swapRate || 'Loading...'}</p>
              </div>
            </div>
            <div className="moonswap-box">
              <h4 className="moonswap-heading">Transaction Fee</h4>
              <div className="moonswap-info-display">
                <p>{`${swapFee}%` || 'Loading...'}</p>
              </div>
            </div>
            <div className="moonswap-box">
              <h4 className="moonswap-heading">Total Transactions</h4>
              <div className="moonswap-info-display">
                <p>{`${totalTransactions}`}</p>
              </div>
            </div>
            <div className="moonswap-box">
              <h4 className="moonswap-heading">Total Tokens Burned</h4>
              <div className="moonswap-info-display">
                <p>{totalBurned || 'Loading...'}</p>
              </div>
            </div>
            <div className="moonswap-box">
              <h4 className="moonswap-heading">Total Fund Allocation</h4>
              <div className="moonswap-info-display">
                <p>{totalFund || 'Loading...'}</p>
              </div>
            </div>
          </div>
        </div>
        <p className="moonswap-subtitle">
          Moonswap is an ERC20 test token on Sepolia. This is not an ICO. this
          is not a monetary transaction.
        </p>
      </div>
    </div>
  );
};

export default SwapPage;
