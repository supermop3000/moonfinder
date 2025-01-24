class Asset {
  constructor(id, hootfolioId, name, symbol, image, balance, marketPrice) {
    this.id = id;
    this.name = name;
    this.symbol = symbol;
    this.image = image;
    this.balance = balance;
    this.marketPrice = marketPrice;
    this.hootfolioId = hootfolioId;
  }

  updateAssetData() {
    // Find the asset by id from the marketData
    const asset = this.assetData.find((asset) => asset.id === this.id);

    // If the asset is found, update the properties, otherwise set default values
    if (asset) {
      this.name = asset.name;
      this.symbol = asset.symbol;
      this.image = asset.image;
      this.marketPrice = asset.current_price;
    } else {
      this.name = 'Unknown Asset';
      this.symbol = 'N/A';
      this.image = '';
      this.marketPrice = 0;
    }
  }

  get totalValue() {
    return this.balance * this.marketPrice;
  }
}

export default Asset;
