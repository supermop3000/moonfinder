class Hootfolio {
  constructor(id, userId, name, createdAt) {
    this.id = id;
    this.userId = userId;
    this.name = name;
    this.createdAt = createdAt;
    this.assets = []; // This will hold the assets for the hootfolio
  }

  addAsset(asset) {
    this.assets.push(asset);
  }

  removeAsset(assetId) {
    this.assets = this.assets.filter((asset) => asset.id !== assetId);
  }
}
