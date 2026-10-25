export const artworks = [
 {id:'slow',title:'Slow mornings',bg:'#eee7d4',ink:'#ac4c30',lines:['SLOW','MORNINGS'],motif:'sun'},
 {id:'outside',title:'Go outside',bg:'#ced5bc',ink:'#315147',lines:['GO','OUTSIDE'],motif:'hill'},
 {id:'less',title:'Less, but better',bg:'#272d3b',ink:'#f0e8d2',lines:['LESS,','BUT','BETTER.'],motif:'type'},
 {id:'sun',title:'Here comes the sun',bg:'#e9b945',ink:'#702e24',lines:['HERE COMES','THE SUN'],motif:'sun'},
 {id:'bloom',title:'Room to bloom',bg:'#e9c7bd',ink:'#773c47',lines:['ROOM TO','BLOOM'],motif:'flower'},
 {id:'play',title:'Make time to play',bg:'#4972a0',ink:'#eee3bc',lines:['MAKE TIME','TO PLAY'],motif:'circle'}
];
export const templates = [
 {id:'statement',title:'The statement',slots:[[50,46,29]]},
 {id:'pair',title:'Perfect pair',slots:[[34,46,23],[66,46,23]]},
 {id:'triptych',title:'Three in a row',slots:[[23,46,20],[50,46,20],[77,46,20]]},
 {id:'gallery',title:'Gallery wall',slots:[[29,29,20],[62,27,16],[29,68,16],[65,66,21]]}
];
export const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||min));
export function normalizePiece(piece,allowedArtworks=artworks){
 if(!piece||!allowedArtworks.some(a=>a.id===piece.art))return null;
 const artwork=allowedArtworks.find(a=>a.id===piece.art);const imageIndex=Number.isInteger(piece.imageIndex)&&piece.imageIndex>0&&piece.imageIndex<(artwork.images?.length||1)?piece.imageIndex:0;
 return {...(imageIndex?{imageIndex}:{}),art:piece.art,x:clamp(piece.x,15,85),y:clamp(piece.y,22,78),size:clamp(piece.size,10,32),frame:['black','white','oak','none'].includes(piece.frame)?piece.frame:'black'};
}
export function artworkSvg(art){
 let shape='';
 if(art.motif==='sun')shape='<circle cx="200" cy="245" r="104" fill="currentColor"/><path d="M65 245h270M65 270h270M65 295h270M65 320h270" stroke="'+art.bg+'" stroke-width="9"/>';
 if(art.motif==='hill')shape='<path d="M30 350 150 165 250 350Z" fill="currentColor"/><path d="m160 350 90-140 120 140Z" fill="currentColor" opacity=".55"/><circle cx="295" cy="150" r="30" fill="currentColor"/>';
 if(art.motif==='flower')shape='<g fill="currentColor"><ellipse cx="200" cy="230" rx="45" ry="110"/><ellipse cx="200" cy="230" rx="110" ry="45"/><circle cx="200" cy="230" r="35" fill="'+art.bg+'"/></g>';
 if(art.motif==='circle')shape='<circle cx="155" cy="240" r="95" fill="currentColor"/><circle cx="245" cy="240" r="95" fill="none" stroke="'+art.bg+'" stroke-width="18"/>';
 const type=art.motif==='type';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600"><rect width="400" height="600" fill="${art.bg}"/><g color="${art.ink}">${shape}</g><g fill="${art.ink}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="800">${art.lines.map((line,i)=>`<text x="200" y="${(type?210:440)+i*(type?77:44)}" font-size="${type?64:36}" letter-spacing="-1">${line}</text>`).join('')}</g><text x="200" y="565" text-anchor="middle" font-family="Arial,sans-serif" font-size="10" letter-spacing="3" fill="${art.ink}">STICK IT UP / STUDIO CONCEPT</text></svg>`;
}
