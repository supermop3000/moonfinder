import React, { useState } from 'react';
import '../styles/AssetSearchBar.css';

function AssetSearchBar({ marketData, selectedAsset, onSelect }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMarketData = searchQuery
    ? marketData.filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : marketData;

  const topAssets = marketData.slice(0, 8);

  const handleAssetClick = (crypto) => {
    if (selectedAsset?.id === crypto.id) {
      // Unselect if the same asset is clicked
      onSelect(null); // Notify parent about deselection
      setSearchQuery(''); // Clear search bar
    } else {
      // Select the asset
      onSelect(crypto); // Notify parent about selection
      setSearchQuery(''); // Clear search bar
    }
  };

  return (
    <div className="asset-search-bar">
      {/* Show search bar only when no asset is selected */}
      {!selectedAsset && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for an asset"
        />
      )}

      {/* Show selected asset if one is selected */}
      {selectedAsset ? (
        <div className="selected-asset">
          <button
            key={selectedAsset.id}
            className="asset-button selected"
            onClick={() => handleAssetClick(selectedAsset)}
          >
            <img
              src={selectedAsset.image}
              alt={selectedAsset.name}
              className="top-asset-icon"
            />
            <span>{selectedAsset.name}</span>
          </button>
        </div>
      ) : (
        // Show search results or top assets when no asset is selected
        <div className="search-results">
          {searchQuery
            ? filteredMarketData.slice(0, 8).map((crypto) => (
                <button
                  key={crypto.id}
                  className={`asset-button ${selectedAsset?.id === crypto.id ? 'selected' : ''}`}
                  onClick={() => handleAssetClick(crypto)}
                >
                  <img
                    src={crypto.image}
                    alt={crypto.name}
                    className="top-asset-icon"
                  />
                  <span>{crypto.name}</span>
                </button>
              ))
            : topAssets.map((crypto) => (
                <button
                  key={crypto.id}
                  className={`asset-button ${selectedAsset?.id === crypto.id ? 'selected' : ''}`}
                  onClick={() => handleAssetClick(crypto)}
                >
                  <img
                    src={crypto.image}
                    alt={crypto.name}
                    className="top-asset-icon"
                  />
                  <span>{crypto.name}</span>
                </button>
              ))}
        </div>
      )}
    </div>
  );
}

export default AssetSearchBar;
