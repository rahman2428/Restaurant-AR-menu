import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

class GltfAssetCache {
  private readonly loader = new GLTFLoader();
  private readonly resolved = new Map<string, GLTF>();
  private readonly pending = new Map<string, Promise<GLTF>>();
  private readonly binaryResolved = new Set<string>();
  private readonly binaryPending = new Map<string, Promise<void>>();

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

  preloadMany(urls: string[], maxConcurrent = 2) {
    const queue = [...new Set(urls)].filter(Boolean);

    if (queue.length === 0) {
      return;
    }

    const parallel = Math.max(1, Math.min(maxConcurrent, queue.length));

    const worker = async () => {
      while (queue.length > 0) {
        const next = queue.shift();

        if (!next) {
          break;
        }

        try {
          await this.load(next);
        } catch {
          // Ignore warm-up failures; runtime loading still has its own fallback path.
        }
      }
    };

    void Promise.all(Array.from({ length: parallel }, () => worker()));
  }

  preloadBinary(url?: string) {
    if (
      !url ||
      typeof window === "undefined" ||
      this.binaryResolved.has(url) ||
      this.binaryPending.has(url)
    ) {
      return;
    }

    const request = fetch(url, {
      cache: "force-cache",
      credentials: "same-origin"
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to warm binary asset: ${response.status}`);
        }

        await response.arrayBuffer();
        this.binaryResolved.add(url);
        this.binaryPending.delete(url);
      })
      .catch(() => {
        this.binaryPending.delete(url);
      });

    this.binaryPending.set(url, request);
  }

  preloadBinaryMany(urls: string[], maxConcurrent = 2) {
    const queue = [...new Set(urls)].filter(Boolean);

    if (queue.length === 0 || typeof window === "undefined") {
      return;
    }

    const parallel = Math.max(1, Math.min(maxConcurrent, queue.length));

    const worker = async () => {
      while (queue.length > 0) {
        const next = queue.shift();

        if (!next) {
          break;
        }

        this.preloadBinary(next);
        await this.binaryPending.get(next);
      }
    };

    void Promise.all(Array.from({ length: parallel }, () => worker()));
  }
}

export const gltfAssetCache = new GltfAssetCache();
