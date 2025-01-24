class MarketAsset {
  constructor(id, name, symbol, image, balance, marketPrice) {
    this.id = id;
    this.name = name;
    this.symbol = symbol;
    this.image = image;
    this.balance = balance;
    this.marketPrice = marketPrice;
  }

  get totalValue() {
    return this.balance * this.marketPrice;
  }
}
