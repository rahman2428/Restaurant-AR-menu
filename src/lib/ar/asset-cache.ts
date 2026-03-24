import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

class GltfAssetCache {
  private readonly loader = new GLTFLoader();
  private readonly resolved = new Map<string, GLTF>();
  private readonly pending = new Map<string, Promise<GLTF>>();

  async load(url: string) {
    if (this.resolved.has(url)) {
      return this.resolved.get(url)!;
    }

    if (this.pending.has(url)) {
      return this.pending.get(url)!;
    }

    const request = this.loader.loadAsync(url).then((asset) => {
      this.resolved.set(url, asset);
      this.pending.delete(url);
      return asset;
    });

    this.pending.set(url, request);

    return request;
  }

  preload(url?: string) {
    if (!url || this.resolved.has(url) || this.pending.has(url)) {
      return;
    }

    void this.load(url).catch(() => undefined);
  }
}

export const gltfAssetCache = new GltfAssetCache();
