class HootfolioAsset {
  constructor(
    id,
    name,
    chainHex,
    image,
    address,
    balance = 0,
    marketPrice = 0,
    purchaseMarketPrice = 0
  ) {
    this.id = id;
    this.name = name;
    this.chainHex = chainHex;
    this.address = address;
    this.image = null;
    this.tradeDate = null;

    this.sourceCurrency = null;
    this.sourceCurrencyAmount = null;

    // Default values if not provided
    this.balance = balance;
    this.marketPrice = marketPrice;
    this.totalValue = this.calculateTotalValue();
    this.purchaseMarketPrice = purchaseMarketPrice;
    this.purchaseTotalCost = this.calculatePurchaseTotalValue();

    // Dynamically set backgroundColor based on asset name
    this.backgroundColor = this.getBackgroundColor(name);

    this.marketData = JSON.parse(localStorage.getItem('marketData')) || null;
    this.setMarketData();
  }

  setMarketData() {
    if (this.marketData) {
      console.log('Checking markets...');
      // Find the asset in the cached market data
      const assetData = this.marketData.find(
        (item) => item.name.toLowerCase() === this.name.toLowerCase()
      );

      if (assetData) {
        this.marketPrice = assetData.current_price;
        console.log(this.marketPrice);
        this.image = assetData.image;
        this.totalValue = this.calculateTotalValue();
      }
    }
  }

  calculatePurchaseTotalValue() {
    this.purchaseTotalCost = this.balance * this.purchaseMarketPrice;
  }

  calculateTotalValue() {
    return this.balance * this.marketPrice;
  }

  getBackgroundColor(name) {
    switch (name.toLowerCase()) {
      case 'bitcoin':
        return '#ff9900'; // Bitcoin's background color (Orange)
      case 'ethereum':
        return '#3c3c3d'; // Ethereum's background color (Dark Gray)
      case 'cardano':
        return '#0033cc'; // Cardano's background color (Blue)
      case 'dogecoin':
        return '#a0c27e'; // Dogecoin's background color (Green)
      default:
        return '#007bff'; // Default color (Blue)
    }
  }

  // formatName() {
  //   return this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
  // }

  getFormattedValue() {
    this.calculateTotalValue();
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0, // No decimals
      maximumFractionDigits: 0, // No decimals
    }).format(this.totalValue);
  }
}

export default HootfolioAsset;
