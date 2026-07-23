export class MemoryStore {
  private store = new Map<string, any>();

  async get(key: string) {
    return this.store.get(key);
  }

  async set(key: string, value: any) {
    this.store.set(key, value);
  }

  async del(key: string) {
    this.store.delete(key);
  }
}
