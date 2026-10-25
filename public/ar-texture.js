// Remove only white pixels connected to the outer edge, retaining enclosed white artwork.
export function removeEdgeWhite(data,width,height){
 const visited=new Uint8Array(width*height),queue=new Uint32Array(width*height);let head=0,tail=0;
 const visit=n=>{if(n<0||n>=visited.length||visited[n])return;visited[n]=1;const i=n*4;if(data[i]>242&&data[i+1]>242&&data[i+2]>242){data[i+3]=0;queue[tail++]=n;}};
 for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
 while(head<tail){const n=queue[head++],x=n%width;if(x)visit(n-1);if(x<width-1)visit(n+1);visit(n-width);visit(n+width);}return data;
}
// Optional exterior-only cleanup. Enclosed gray/white regions and colored pixels remain intact.
export function removePhotoShadow(data,width,height){
 const seen=new Uint8Array(width*height),queue=new Uint32Array(width*height);let head=0,tail=0;
 const visit=n=>{if(n<0||n>=seen.length||seen[n])return;seen[n]=1;const i=n*4,lo=Math.min(data[i],data[i+1],data[i+2]),hi=Math.max(data[i],data[i+1],data[i+2]);if(data[i+3]<16||(lo>=200&&hi-lo<=16)){data[i+3]=0;queue[tail++]=n;}};
 for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
 while(head<tail){const n=queue[head++],x=n%width;if(x)visit(n-1);if(x<width-1)visit(n+1);visit(n-width);visit(n+width);}return data;
}
export async function stickerTexture(handle,cutout=true,signal,crop=true,cleanShadow=false){
 const response=await fetch(`/api/ar/image/${encodeURIComponent(handle)}?canvas=1`,{signal});if(!response.ok)throw new Error('The sticker photo could not load. Try again.');
 const blob=await response.blob(),url=URL.createObjectURL(blob),img=new Image();
 try{img.src=url;await img.decode();if(signal?.aborted)throw new Error('Preparation cancelled.');
 const scale=Math.min(1,768/Math.max(img.naturalWidth,img.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,canvas.width,canvas.height);
 if(!cutout)return canvas;
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);removeEdgeWhite(pixels.data,canvas.width,canvas.height);if(cleanShadow)removePhotoShadow(pixels.data,canvas.width,canvas.height);removeDetachedMarks(pixels.data,canvas.width,canvas.height);ctx.putImageData(pixels,0,0);if(!crop)return canvas;
 let left=canvas.width,top=canvas.height,right=-1,bottom=-1;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){if(pixels.data[(y*canvas.width+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}}
 if(right<left)throw new Error('No artwork remained after removing white. Turn background removal off and try again.');
 const result=document.createElement('canvas');result.width=right-left+1;result.height=bottom-top+1;result.getContext('2d').drawImage(canvas,left,top,result.width,result.height,0,0,result.width,result.height);return result;
 }finally{URL.revokeObjectURL(url);}
}
// Conservative cleanup: only detached marks far outside a dominant central artwork.
// Enclosed lettering is never classified by colour or OCR.
export function removeDetachedMarks(data,width,height){
 const count=width*height,labels=new Int32Array(count),queue=new Uint32Array(count),parts=[];let label=0,total=0;
 for(let n=0;n<count;n++){if(labels[n]||data[n*4+3]<32)continue;label++;let head=0,tail=1;queue[0]=n;labels[n]=label;const p={label,size:0,left:width,top:height,right:0,bottom:0};
 while(head<tail){const v=queue[head++],x=v%width,y=Math.floor(v/width);p.size++;p.left=Math.min(p.left,x);p.right=Math.max(p.right,x);p.top=Math.min(p.top,y);p.bottom=Math.max(p.bottom,y);for(const q of [x?v-1:-1,x<width-1?v+1:-1,v-width,v+width])if(q>=0&&q<count&&!labels[q]&&data[q*4+3]>=32){labels[q]=label;queue[tail++]=q;}}
 total+=p.size;parts.push(p);}
 parts.sort((a,b)=>b.size-a.size);const main=parts[0];if(!main||main.size/total<.55)return {removedPixels:0,reason:'No safely dominant artwork; retained all components.'};
 const gap=Math.ceil(Math.max(width,height)*.08),box={left:main.left-gap,right:main.right+gap,top:main.top-gap,bottom:main.bottom+gap};
 if(main.left>width*.6||main.right<width*.4||main.top>height*.7||main.bottom<height*.3)return {removedPixels:0,reason:'Artwork is not central; retained all components.'};
 const discarded=new Set(parts.filter(p=>p.label!==main.label&&p.size<main.size*.15&&(p.right<box.left||p.left>box.right||p.bottom<box.top||p.top>box.bottom)).map(p=>p.label));let removedPixels=0;
 for(let n=0;n<count;n++)if(discarded.has(labels[n])){data[n*4+3]=0;removedPixels++;}
 return {removedPixels,reason:removedPixels?'Removed small, detached marks outside artwork envelope.':'No safely separated marks found.'};
}
