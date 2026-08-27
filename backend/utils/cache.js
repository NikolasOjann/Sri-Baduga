class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (item && item.expiry > Date.now()) {
      return item.value;
    }
    if (item) this.cache.delete(key);
    return null;
  }

  set(key, value, ttlSeconds = 60) {
    this.cache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
  }

  clear() {
    this.cache.clear();
  }
}

module.exports = new SimpleCache();
