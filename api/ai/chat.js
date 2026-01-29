// Implementing in-memory caching

const cache = new Map();

function getCachedData(key) {
    return cache.has(key) ? cache.get(key) : null;
}

function setCachedData(key, data) {
    cache.set(key, data);
}

function clearCache() {
    cache.clear();
}

// Example usage
const exampleKey = 'exampleData';
const exampleData = { value: 'Hello World' };

setCachedData(exampleKey, exampleData);
console.log(getCachedData(exampleKey)); // Outputs: { value: 'Hello World' }

// Uncomment to clear cache
// clearCache();
