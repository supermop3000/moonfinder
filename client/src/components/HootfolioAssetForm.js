import React, { useState } from 'react';
import AssetSearchBar from './AssetSearchBar';

function HootfolioAssetForm({ hootfolio, marketData, onSubmit, onCancel }) {
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [amount, setAmount] = useState('');

  const handleSubmit = async () => {
    if (!selectedCrypto || !amount) {
      alert('Please select an asset and provide a valid amount.');
      return;
    }

    try {
      const response = await fetch('/api/hootfolio/add-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hootfolioId: hootfolio.id,
          assetId: selectedCrypto.id,
          name: selectedCrypto.name,
          balance: parseFloat(amount),
          symbol: selectedCrypto.symbol,
          image: selectedCrypto.image,
          marketPrice: selectedCrypto.current_price,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onSubmit(data.asset);
      } else {
        alert('Failed to add asset.');
      }
    } catch (error) {
      console.error('Error submitting asset:', error);
      alert('Failed to add asset.');
    }

    // Reset the form fields
    setAmount('');
    setSelectedCrypto(null);
  };

  return (
    <div className="add-asset">
      <div className="form-select-asset">
        <label> Asset </label>
        <AssetSearchBar
          marketData={marketData}
          onSelect={setSelectedCrypto}
          selectedAsset={selectedCrypto}
          placeholder="Search for an asset..."
        />
      </div>
      <div className="form-enter-amount">
        <label>Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
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

export default HootfolioAssetForm;
