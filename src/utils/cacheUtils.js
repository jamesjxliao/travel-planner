const CACHE_NAME = 'attraction-images-cache-v1';

export async function cacheImage(url, imageName) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(url);
    await cache.put(imageName, response);
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('Cache storage quota exceeded. Clearing old caches.');
      await clearOldCaches();
      // Try caching again after clearing
      const cache = await caches.open(CACHE_NAME);
      const response = await fetch(url);
      await cache.put(imageName, response);
    } else {
      throw error;
    }
  }
}

async function clearOldCaches() {
  const cacheNames = await caches.keys();
  const oldCacheNames = cacheNames.filter(name => name !== CACHE_NAME);
  await Promise.all(oldCacheNames.map(name => caches.delete(name)));
}

export async function getCachedImage(imageName) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(imageName);
  return cachedResponse ? cachedResponse.blob() : null;
}
