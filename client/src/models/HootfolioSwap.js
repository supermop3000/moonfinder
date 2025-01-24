class HootfolioSwap {
  constructor(
    id,
    hootfolioId,
    fromAsset,
    toAsset,
    fromAmount,
    toAmount,
    swapDate
  ) {
    this.id = id;
    this.hootfolioId = hootfolioId;
    this.fromAsset = fromAsset; // Asset being swapped from
    this.toAsset = toAsset; // Asset being swapped to
    this.fromAmount = fromAmount;
    this.toAmount = toAmount;
    this.swapDate = swapDate;
  }
}
