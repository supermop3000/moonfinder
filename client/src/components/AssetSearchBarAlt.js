import React, { useState, useEffect } from 'react';
import '../styles/AssetSearchBarAlt.css';

function AssetSearchBarAlt({
  marketData,
  selectedAsset,
  onSelect,
  resetTrigger,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [isFocused, setIsFocused] = useState(false); // Track input focus state

  useEffect(() => {
    // Reset search bar state when resetTrigger changes
    setSearchQuery('');
    setSelectedCrypto(null);
    setIsFocused(false);
    onSelect(null); // Notify parent that selection is cleared
  }, [resetTrigger]);

  const filteredMarketData = searchQuery
    ? marketData.filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : isFocused // If input is focused, show top 30 results
      ? marketData.slice(0, 30)
      : [];

  const handleAssetClick = (crypto) => {
    if (selectedCrypto?.id === crypto.id) {
      setSelectedCrypto(null);
      onSelect(null);
      setSearchQuery('');
    } else {
      setSelectedCrypto(crypto);
      onSelect(crypto);
    }
    setIsFocused(false); // Hide dropdown after selection
  };

  return (
    <div className="asset-search-bar-alt">
      {!selectedCrypto && (
        <div className="search-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)} // Show dropdown on focus
            onBlur={() => setTimeout(() => setIsFocused(false), 100)} // Delay hiding to allow click
            placeholder="Enter Asset"
            className="search-input"
          />
          {(searchQuery || isFocused) && (
            <ul className="dropdown-results">
              {filteredMarketData.map((crypto) => (
                <li
                  key={crypto.id}
                  className={`dropdown-item ${selectedAsset?.id === crypto.id ? 'selected' : ''}`}
                  onClick={() => handleAssetClick(crypto)}
                >
                  <img
                    src={crypto.image}
                    alt={crypto.name}
                    className="dropdown-icon"
                  />
                  <span className="dropdown-text">
                    {crypto.name} ({crypto.symbol.toUpperCase()})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectedCrypto && (
        <div className="selected-asset">
          <button
            key={selectedCrypto.id}
            className="asset-button selected"
            onClick={() => handleAssetClick(selectedCrypto)}
          >
            <img
              src={selectedCrypto.image}
              alt={selectedCrypto.name}
              className="top-asset-icon"
            />
            <span>{selectedCrypto.name}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default AssetSearchBarAlt;
