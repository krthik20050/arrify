import{readFileSync,writeFileSync}from'node:fs';import{load}from'cheerio';
const $=load(readFileSync('homepage.html','utf8'));let js='';$('script').each((i,e)=>{if($(e).text().includes('siuVibeGrid'))js=$(e).text();});writeFileSync('public/vibes.js',js);
const collection=load(readFileSync('reference/pages/%2Fcollections%2Fbuy-vinyl-stickers-online-india.html','utf8'));
console.log('grid',collection('#product-grid').length,collection('#product-grid .card-wrapper').length,collection('a[href*="page="]').map((i,e)=>collection(e).attr('href')).get().slice(-10));
