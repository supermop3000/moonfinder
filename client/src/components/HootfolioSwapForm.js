import React, { useState, useEffect } from 'react';
import AssetSearchBarAlt from './AssetSearchBarAlt';

function HootfolioSwapForm({
  hootfolio,
  marketData,
  onSubmit,
  onCancel,
  resetTrigger,
}) {
  const getCurrentDate = () => new Date().toISOString().split('T')[0];

  const [swapDate, setSwapDate] = useState(getCurrentDate());
  const [sentCurrency, setSentCurrency] = useState(null);
  const [sentAmount, setSentAmount] = useState('');
  const [receivedCurrency, setReceivedCurrency] = useState(null);
  const [receivedAmount, setReceivedAmount] = useState('');

  // Reset form state on resetTrigger change
  useEffect(() => {
    setSwapDate(getCurrentDate());
    setSentCurrency(null);
    setSentAmount('');
    setReceivedCurrency(null);
    setReceivedAmount('');
  }, [resetTrigger]);

  const handleSubmit = async () => {
    if (
      !swapDate ||
      !sentAmount ||
      !receivedAmount ||
      !sentCurrency ||
      !receivedCurrency
    ) {
      alert('Please fill out all fields.');
      return;
    }

    const swapData = {
      hootfolioId: hootfolio.id,
      swapDate,
      sentAsset: {
        assetId: sentCurrency.id,
        name: sentCurrency.name,
        balance: -parseFloat(sentAmount),
        symbol: sentCurrency.symbol,
        image: sentCurrency.image,
        marketPrice: sentCurrency.current_price,
      },
      receivedAsset: {
        assetId: receivedCurrency.id,
        name: receivedCurrency.name,
        balance: parseFloat(receivedAmount),
        symbol: receivedCurrency.symbol,
        image: receivedCurrency.image,
        marketPrice: receivedCurrency.current_price,
      },
    };

    try {
      const response = await fetch('/api/hootfolio/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(swapData),
      });

      if (!response.ok) {
        alert('Failed to process swap.');
        return;
      }

      alert('Swap processed successfully!');
      onSubmit();
    } catch (error) {
      console.error('Error processing swap:', error);
    }
  };

  return (
    <div className="add-swap">
      <label>Swap Date</label>
      <div className="swap-date-container">
        <input
          className="swap-date"
          type="date"
          value={swapDate}
          onChange={(e) => setSwapDate(e.target.value)}
        />
      </div>

      <div className="swap-row">
        <div className="swap-column">
          <label class="label_space">Sent Asset</label>
          <AssetSearchBarAlt
            marketData={marketData}
            selectedAsset={sentCurrency}
            onSelect={setSentCurrency}
            resetTrigger={resetTrigger}
          />
        </div>
        <div className="swap-column">
          <label className="label_space">Received Asset</label>
          <AssetSearchBarAlt
            marketData={marketData}
            selectedAsset={receivedCurrency}
            onSelect={setReceivedCurrency}
            resetTrigger={resetTrigger}
          />
        </div>
      </div>

      <div className="swap-row">
        <div className="swap-column">
          <label class="label_space">Sent Amount</label>
          <input
            type="number"
            value={sentAmount}
            onChange={(e) => setSentAmount(e.target.value)}
            placeholder="Enter sent amount"
          />
        </div>
        <div className="swap-column">
          <label className="label_space">Received Amount</label>
          <input
            type="number"
            value={receivedAmount}
            onChange={(e) => setReceivedAmount(e.target.value)}
            placeholder="Enter received amount"
          />
        </div>
      </div>

      <div className="form-action-buttons">
        <button onClick={handleSubmit} className="submit-button">
          Submit
        </button>
        <button onClick={onCancel} className="cancel-button">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default HootfolioSwapForm;
