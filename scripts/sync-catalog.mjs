import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://www.stickitup.xyz';
const output = path.join(root, 'data');
const observations = [];
const startedAt = new Date().toISOString();
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchJSON(url) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const { stdout } = await exec(process.platform === 'win32' ? 'curl.exe' : 'curl',
        ['--location', '--fail', '--silent', '--show-error', '--max-time', '90', url],
        { maxBuffer: 64 * 1024 * 1024, windowsHide: true });
      return JSON.parse(stdout);
    } catch (error) {
      lastError = error;
      await pause(1000 * 2 ** attempt);
    }
  }
  throw new Error(`Failed to capture ${url}: ${lastError.message}`);
}

async function paginate(endpoint, key) {
  const values = [];
  const seen = new Set();
  const pageCounts = [];
  for (let page = 1; ; page++) {
    const url = `${base}${endpoint}?limit=250&page=${page}`;
    const json = await fetchJSON(url);
    if (!Array.isArray(json[key])) throw new Error(`Missing ${key} array at ${url}`);
    const batch = json[key];
    pageCounts.push(batch.length);
    for (const item of batch) {
      if (seen.has(item.id)) throw new Error(`Duplicate ${key} ID ${item.id} at ${url}`);
      seen.add(item.id);
      values.push(item);
    }
    // Always request the terminal empty page; a short page is not assumed complete.
    if (batch.length === 0) break;
    await pause(125);
  }
  observations.push({ endpoint, key, count: values.length, pageCounts, terminalEmptyPage: true });
  console.log(`${endpoint}: ${values.length} records (${pageCounts.length} pages)`);
  return values;
}

await mkdir(output, { recursive: true });
const [products, apiCollections] = await Promise.all([
  paginate('/products.json', 'products'),
  paginate('/collections.json', 'collections'),
]);
await writeFile(path.join(output, 'catalog.json'), JSON.stringify({ products }));
const html = await readFile(path.join(root, 'homepage.html'), 'utf8').catch(() => '');
const linkedHandles = [...html.matchAll(/\/collections\/([a-zA-Z0-9_-]+)/g)].map(match => match[1]);
const collectionMap = new Map(apiCollections.map(collection => [collection.handle, collection]));
for (const handle of new Set(linkedHandles)) {
  if (!collectionMap.has(handle)) collectionMap.set(handle, { handle, title: handle === 'all' ? 'All products' : handle.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' '), discovered_from: `${base}/` });
}
const collections = [...collectionMap.values()];
const byId = new Map(products.map(product => [product.id, product]));
let cursor = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (cursor < collections.length) {
    const collection = collections[cursor++];
    const members = await paginate(`/collections/${encodeURIComponent(collection.handle)}/products.json`, 'products');
    collection.product_ids = members.map(product => product.id);
    collection.product_count = members.length;
    for (const product of members) if (!byId.has(product.id)) byId.set(product.id, product);
  }
}));
const completeProducts = [...byId.values()];
await writeFile(path.join(output, 'catalog.json'), JSON.stringify({ products: completeProducts }));
await writeFile(path.join(output, 'collections.json'), JSON.stringify({ collections }));
const manifest = {
  source: base,
  startedAt,
  capturedAt: new Date().toISOString(),
  currency: 'INR',
  productCount: completeProducts.length,
  rootProductCount: products.length,
  collectionCount: collections.length,
  variantCount: completeProducts.reduce((sum, product) => sum + product.variants.length, 0),
  imageCount: completeProducts.reduce((sum, product) => sum + product.images.length, 0),
  soldOutProductCount: completeProducts.filter(product => !product.variants.some(variant => variant.available)).length,
  additionalProductsFromCollections: completeProducts.length - products.length,
  observations,
  limitations: ['Public storefront snapshot, not private inventory or unpublished products.', 'Prices and availability may change after capture.', 'Images remain original remote Shopify CDN URLs.'],
};
await writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ ...manifest, observations: `${observations.length} verified paginated endpoints` }, null, 2));
