const BASE='https://huggingface.co/mlc-ai/Qwen3-0.6B-q4f16_1-MLC/resolve/main/';
const CHUNK=4*1024*1024;
// Range downloads avoid one opaque, long request; completed shards survive a reload.
export async function prepareWeights(progress=()=>{},helperOrigin=''){
 const checks=await fetch(new URL('./model-files.json',import.meta.url));
 if(!checks.ok)throw new Error('本地模型校验目录不可用');
 const pinned=await checks.json();
 const rows=pinned.files;
 if(!Array.isArray(rows)||rows.length<1||rows.length>16||rows.some(r=>!/^params_shard_\d+\.bin$/.test(r.dataPath)||!Number.isInteger(r.nbytes)||r.nbytes<1||r.nbytes>100*1024*1024))throw new Error('模型文件目录格式不合规');
 const total=rows.reduce((n,r)=>n+r.nbytes,0);
 if(total>600*1024*1024)throw new Error('模型下载超过此版本大小限制');
 const cache=await caches.open('webllm/model');
 if(helperOrigin){
  const base=new URL(helperOrigin);if(!['127.0.0.1','localhost'].includes(base.hostname)||base.protocol!=='http:')throw new Error('下载助手只允许本机地址');
  progress({phase:'download',progress:0,text:'正在通过本机助手准备官方模型文件；研究内容不外发'});
  const resources=[['mlc-chat-config.json','webllm/config',BASE+'mlc-chat-config.json'],['tokenizer.json','webllm/model',BASE+'tokenizer.json'],['tensor-cache.json','webllm/model',BASE+'tensor-cache.json'],['model-lib.wasm','webllm/wasm','https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_84/base/Qwen3-0.6B-q4f16_1_cs1k-webgpu.wasm']];
  for(const [name,scope,original] of resources){const store=await caches.open(scope);if(!await store.match(original)){const r=await fetch(base.origin+'/model-resource/'+name,{credentials:'omit',signal:AbortSignal.timeout(240000)});if(!r.ok)throw new Error('本机下载助手未取得模型资源：HTTP '+r.status);await store.put(original,new Response(await r.arrayBuffer(),{headers:{'Content-Type':name.endsWith('.json')?'application/json':'application/octet-stream'}}));}}
 }
 const amounts=rows.map(()=>0);let next=0;
 const notify=()=>{const bytes=amounts.reduce((a,b)=>a+b,0);progress({phase:'download',progress:bytes/total,text:'模型文件 '+(bytes/1048576).toFixed(1)+' / '+(total/1048576).toFixed(1)+' MB（完成的文件可复用）'});};
 const digest=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),x=>x.toString(16).padStart(2,'0')).join('');
 async function file(i){const row=rows[i],url=BASE+row.dataPath;const expected=pinned.sha256?.[row.dataPath];if(!/^[a-f0-9]{64}$/.test(expected||''))throw new Error('模型权重缺少可信哈希');const prior=await cache.match(url);if(prior){const bytes=await prior.arrayBuffer();if(bytes.byteLength===row.nbytes&&await digest(bytes)===expected){amounts[i]=row.nbytes;notify();return;}}
  const data=new Uint8Array(row.nbytes);
  for(let start=0;start<row.nbytes;start+=CHUNK){const end=Math.min(start+CHUNK,row.nbytes)-1;const fetchURL=helperOrigin?new URL(helperOrigin).origin+'/model-resource/'+row.dataPath:url;const res=await fetch(fetchURL,{headers:{Range:'bytes='+start+'-'+end},credentials:'omit',signal:AbortSignal.timeout(helperOrigin?240000:60000)});if(res.status!==206)throw new Error('模型分段下载未获正确响应：HTTP '+res.status);const reader=res.body.getReader();let count=0;
   while(true){const {done,value}=await reader.read();if(done)break;if(start+count+value.length>end+1){await reader.cancel();throw new Error('模型分段数据超过边界');}data.set(value,start+count);count+=value.length;amounts[i]=start+count;notify();}
   if(count!==end-start+1)throw new Error('模型文件传输不完整，已停止初始化');
  }
  const sha=await digest(data);if(sha!==expected)throw new Error('模型权重校验失败，未启动推理；请重新加载');
  await cache.put(url,new Response(data,{headers:{'Content-Type':'application/octet-stream','Content-Length':String(row.nbytes),'X-InvestLens-SHA256':sha}}));
 }
 async function lane(){while(next<rows.length){const i=next++;await file(i);}}
 await Promise.all([lane(),lane()]);return {bytes:total,shards:rows.length};
}
