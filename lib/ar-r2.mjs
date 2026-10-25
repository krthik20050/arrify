import {S3Client,GetObjectCommand,PutObjectCommand} from '@aws-sdk/client-s3';

export function r2Configured(env=process.env){
 return Boolean(env.R2_ENDPOINT&&env.R2_ACCESS_KEY_ID&&env.R2_SECRET_ACCESS_KEY);
}

export function createR2Store(env=process.env,providedClient){
 const endpoint=new URL(env.R2_ENDPOINT);
 if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.pathname!=='/'||endpoint.search||endpoint.hash)throw new Error('R2_ENDPOINT must be an HTTPS origin.');
 if(!/^[a-f0-9]{32}$/i.test(env.R2_ACCESS_KEY_ID||'')||!/^[a-f0-9]{64}$/i.test(env.R2_SECRET_ACCESS_KEY||''))throw new Error('R2 S3 credentials are invalid.');
 const bucket=env.R2_BUCKET||'stickitup-ar-assets';
 const client=providedClient||new S3Client({region:'auto',endpoint:endpoint.origin,maxAttempts:2,credentials:{accessKeyId:env.R2_ACCESS_KEY_ID,secretAccessKey:env.R2_SECRET_ACCESS_KEY}});
 const options=()=>({abortSignal:AbortSignal.timeout(20000)});
 return {
  async read(name,binary=false){
   let result;
   try{result=await client.send(new GetObjectCommand({Bucket:bucket,Key:name}),options());}
   catch(error){if(error.name==='NoSuchKey'||error.$metadata?.httpStatusCode===404)return null;throw error;}
   const bytes=Buffer.from(await result.Body.transformToByteArray());
   return binary?bytes:JSON.parse(bytes.toString('utf8'));
  },
  async write(name,value,type){
   await client.send(new PutObjectCommand({Bucket:bucket,Key:name,Body:value,ContentType:type,CacheControl:'no-store'}),options());
  }
 };
}
