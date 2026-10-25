import{mkdir,cp}from'node:fs/promises';
const stage='artifacts/stickitup-source';
await mkdir(`${stage}/reference`,{recursive:true});
for(const item of ['server.mjs','lib','public','data','scripts','tests','docs','.github','.gitignore','homepage.html','package.json','package-lock.json','README.md','PRODUCT.md','DESIGN.md'])await cp(item,`${stage}/${item}`,{recursive:true});
for(const item of ['pages','theme','routes.json','assets.json','capture-report.json','filter-report.json','link-audit.json','theme-scripts.json','quiz-original.js'])await cp(`reference/${item}`,`${stage}/reference/${item}`,{recursive:true});
console.log(`Shareable source staged in ${stage}`);
