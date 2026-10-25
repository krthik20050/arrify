import {zipSync,strToU8} from 'fflate';
import {makeStickerGlb} from './ar.mjs';
// USDZ is an uncompressed ZIP with every file payload aligned to 64 bytes.
export function alignedUsdz(files){
 let offset=0;const entries={};
 for(const [name,data] of Object.entries(files)){
  const padding=(64-(offset+30+Buffer.byteLength(name)+4)%64)%64;
  entries[name]=[new Uint8Array(data),{level:0,extra:{12345:new Uint8Array(padding)}}];
  offset+=30+Buffer.byteLength(name)+4+padding+data.length;
 }
 return Buffer.from(zipSync(entries,{level:0}));
}
export function makeStickerUsdz(png,widthMm,heightMm,rotation=0,tilt=0,lean=0,placement='floor'){
 const {bytes}=makeStickerGlb(png,widthMm,heightMm,placement,rotation,tilt,lean),length=bytes.readUInt32LE(12),g=JSON.parse(bytes.toString('utf8',20,20+length));
 const base=28+length,view=g.bufferViews[0],coords=Array.from({length:24},(_,i)=>bytes.readFloatLE(base+view.byteOffset+i*4));
 const points=Array.from({length:8},(_,i)=>`(${coords.slice(i*3,i*3+3).join(', ')})`).join(', ');
 const normals=Array.from({length:8},(_,i)=>`(${Array.from({length:3},(_,j)=>bytes.readFloatLE(base+g.bufferViews[1].byteOffset+(i*3+j)*4)).join(', ')})`).join(', ');
 // Match model-viewer's wall-export strategy: upright geometry without forced
 // plane anchoring, which otherwise asks Quick Look to rotate an already-authored model.
 const anchor=placement==='wall'?'':` (prepend apiSchemas = ["Preliminary_AnchoringAPI"])`;
 const plane=placement==='wall'?'':` uniform token preliminary:anchoring:type = "plane"
 uniform token preliminary:planeAnchoring:alignment = "any"
`;
 const usd=`#usda 1.0
(
 defaultPrim = "Root"
 metersPerUnit = 1
 upAxis = "Y"
)
def Xform "Root"${anchor} {
${plane} def Mesh "Sticker" (prepend apiSchemas = ["MaterialBindingAPI"]) {
  uniform token subdivisionScheme = "none"
  bool doubleSided = 0
  point3f[] points = [${points}]
  int[] faceVertexCounts = [3,3,3,3]
  int[] faceVertexIndices = [0,1,2,0,2,3,4,6,5,4,7,6]
  normal3f[] normals = [${normals}] (interpolation = "vertex")
  texCoord2f[] primvars:st = [(0,0),(1,0),(1,1),(0,1),(0,0),(1,0),(1,1),(0,1)] (interpolation = "vertex")
  rel material:binding = </Root/Materials/Sticker>
 }
 def Scope "Materials" {
  def Material "Sticker" {
   token outputs:surface.connect = </Root/Materials/Sticker/Surface.outputs:surface>
   def Shader "Surface" {
    uniform token info:id = "UsdPreviewSurface"
    color3f inputs:diffuseColor.connect = </Root/Materials/Sticker/Texture.outputs:rgb>
    float inputs:opacity.connect = </Root/Materials/Sticker/Texture.outputs:a>
    float inputs:opacityThreshold = 0.15
    float inputs:metallic = 0
    float inputs:roughness = 1
    token outputs:surface
   }
   def Shader "UV" {
    uniform token info:id = "UsdPrimvarReader_float2"
    token inputs:varname = "st"
    float2 outputs:result
   }
   def Shader "Texture" {
    uniform token info:id = "UsdUVTexture"
    asset inputs:file = @textures/sticker.png@
    float2 inputs:st.connect = </Root/Materials/Sticker/UV.outputs:result>
    token inputs:sourceColorSpace = "sRGB"
    token inputs:wrapS = "clamp"
    token inputs:wrapT = "clamp"
    float3 outputs:rgb
    float outputs:a
   }
  }
 }
}
`;
 return alignedUsdz({'model.usda':strToU8(usd),'textures/sticker.png':png});
}
