import {mkdir,cp,writeFile,readFile,readdir} from 'node:fs/promises';import {spawnSync}from'node:child_process';
// Build a portable Node deployment folder; no live Shopify API is needed at runtime.
const testFiles=(await readdir('tests')).filter(name=>name.endsWith('.test.mjs')).map(name=>`tests/${name}`);
const result=spawnSync(process.execPath,['--test',...testFiles],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
await mkdir('dist',{recursive:true});
for(const name of ['server.mjs','lib','public','data','homepage.html','package.json','package-lock.json','README.md'])await cp(name,`dist/${name}`,{recursive:true});
await mkdir('dist/reference',{recursive:true});
for(const name of ['pages','routes.json','assets.json','capture-report.json','filter-report.json'])await cp(`reference/${name}`,`dist/reference/${name}`,{recursive:true});
const pkg=JSON.parse(await readFile('package.json','utf8'));pkg.scripts={start:'node server.mjs'};await writeFile('dist/package.json',JSON.stringify(pkg,null,2));
console.log('Portable deployment built in dist/. Run npm ci --omit=dev and npm start there.');
