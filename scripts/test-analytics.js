const { list, get } = require("@vercel/blob");
const { createGunzip } = require("node:zlib");
const { pipeline } = require("node:stream/promises");

async function main() {
  const action = process.argv[2]; // 'list-raw', 'list-monthly', 'view'

  try {
    if (action === 'list-raw') {
      console.log('Listing recent raw analytics shards...');
      const all = [];
      let cursor;
      do {
        const res = await list({ prefix: 'analytics/raw/', limit: 1000, cursor });
        all.push(...res.blobs);
        cursor = res.cursor;
      } while (cursor);
      console.log(`Found ${all.length} raw shards`);
      // Show last 10
      all.slice(-10).forEach(b => console.log(`- ${b.pathname}`));

    } else if (action === 'list-monthly') {
      console.log('Listing monthly analytics dumps...');
      const res = await list({ prefix: 'analytics/monthly/' });
      console.log(`Found ${res.blobs.length} monthly dumps`);
      res.blobs.forEach(b => console.log(`- ${b.pathname}`));

    } else if (action === 'view') {
      const key = process.argv[3];
      if (!key) {
        console.log('Provide a blob key (e.g., analytics/raw/2023/10/01/...)');
        return;
      }
      console.log(`Viewing content of ${key}...`);
      const { body, contentType } = await get(key);

      let content;
      if (contentType && contentType.includes('gzip')) {
        // Decompress gzipped content
        const chunks = [];
        const gunzip = createGunzip();
        gunzip.on('data', chunk => chunks.push(chunk));
        await new Promise((resolve, reject) => {
          gunzip.on('end', resolve);
          gunzip.on('error', reject);
          pipeline(body, gunzip).catch(reject);
        });
        content = Buffer.concat(chunks).toString();
      } else {
        content = await body.text();
      }

      // Log first 2000 chars to avoid flooding console
      console.log(content.slice(0, 2000));
      if (content.length > 2000) {
        console.log(`\n... (truncated, total length: ${content.length})`);
      }

    } else {
      console.log('Usage:');
      console.log('  node scripts/test-analytics.js list-raw       # List recent raw shards');
      console.log('  node scripts/test-analytics.js list-monthly   # List monthly dumps');
      console.log('  node scripts/test-analytics.js view <key>     # View content of a specific blob');
      console.log('\nSet BLOB_READ_WRITE_TOKEN env var before running.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();