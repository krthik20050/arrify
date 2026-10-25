import {readFile,readdir,mkdir,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root=path.resolve(import.meta.dirname,'..'),base=path.join(root,'data/posters');
const manifest=JSON.parse(await readFile(path.join(base,'manifest.json'),'utf8'));
const images=JSON.parse(await readFile(path.join(base,'images.json'),'utf8'));
if(manifest.downloadedImageCount!==manifest.imageCount||manifest.failures.length)throw new Error('Capture must finish successfully before image verification.');
const values=[...new Set(Object.values(images))],thumbDir=path.join(root,'public/poster-assets/thumbs');await mkdir(thumbDir,{recursive:true});
let cursor=0,totalBytes=0;const failures=[];
await Promise.all(Array.from({length:4},async()=>{
 while(cursor<values.length){const image=values[cursor++],file=path.join(root,'public',image);
  try{const meta=await sharp(file).metadata();if(!meta.width||!meta.height)throw new Error('Missing image dimensions');totalBytes+=(await stat(file)).size;
   const thumb=path.join(thumbDir,path.basename(image,path.extname(image))+'.webp');
   if(!(await stat(thumb).catch(()=>null))?.size)await sharp(file).rotate().resize(480,640,{fit:'inside',withoutEnlargement:true}).webp({quality:76}).toFile(thumb);
  }catch(error){failures.push({image,error:error.message});}
 }
}));
const report={verifiedAt:new Date().toISOString(),images:values.length,totalBytes,thumbnails:(await readdir(thumbDir)).length,failures};
await writeFile(path.join(base,'image-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(failures.length)process.exitCode=1;
