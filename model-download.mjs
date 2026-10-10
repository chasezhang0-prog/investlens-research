import {mkdir,readFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
const root=new URL('./.model-cache/',import.meta.url);
const pinned=JSON.parse(await readFile(new URL('./model-files.json',import.meta.url),'utf8'));
const allowed=new Set([...Object.keys(pinned.sha256),'tensor-cache.json','mlc-chat-config.json','tokenizer.json','model-lib.wasm']);
const pending=new Map();let active=0;const waiting=[];
async function slot(){if(active>=2)await new Promise(ok=>waiting.push(ok));active++;}
function release(){active--;waiting.shift()?.();}
async function obtain(name){await mkdir(root,{recursive:true});const file=new URL(name,root);try{await stat(file);return file;}catch{}
 await slot();try{
  await promisify(execFile)(process.env.INVESTLENS_PYTHON||'python3',[fileURLToPath(new URL('./download-model.py',import.meta.url)),name],{timeout:240000,maxBuffer:4096});return file;
 }finally{release();}
}
export async function serveModel(req,res,name){if(!allowed.has(name)){res.writeHead(404);res.end('Unknown model resource');return;}try{if(!pending.has(name))pending.set(name,obtain(name).finally(()=>pending.delete(name)));const file=await pending.get(name);const size=(await stat(file)).size;const range=req.headers.range;let start=0,end=size-1;
 if(range){const m=/^bytes=(\d+)-(\d*)$/.exec(range);if(!m){res.writeHead(416);res.end();return;}start=Number(m[1]);end=m[2]?Math.min(Number(m[2]),size-1):size-1;if(start>end||start>=size){res.writeHead(416);res.end();return;}}
 const headers={'Content-Type':name.endsWith('.json')?'application/json':'application/octet-stream','Content-Length':String(end-start+1),'Accept-Ranges':'bytes','Cache-Control':'public, max-age=31536000, immutable'};if(range)headers['Content-Range']='bytes '+start+'-'+end+'/'+size;res.writeHead(range?206:200,headers);createReadStream(file,{start,end}).pipe(res);
 }catch(e){res.writeHead(503,{'Content-Type':'text/plain'});res.end('Model download unavailable: '+e.message);}}
