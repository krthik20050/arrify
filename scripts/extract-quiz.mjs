import {readFileSync,writeFileSync} from 'node:fs'; import {load} from 'cheerio';
const $=load(readFileSync('reference/pages/%2Fpages%2Ffind-your-vibe.html','utf8'));
const js=$('main script').text();
writeFileSync('reference/quiz-original.js',js);
console.log(js.slice(-11500));
