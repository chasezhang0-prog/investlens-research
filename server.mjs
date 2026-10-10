// Private/local service. The public reviewer site uses browser-scoped records.
import http from 'node:http';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHmac,timingSafeEqual} from 'node:crypto';
import * as core from './core.mjs';
import {services} from './adapters.mjs';
const ROOT=dirname(fileURLToPath(import.meta.url));
const STATE=resolve(process.env.INVESTLENS_STATE||resolve(ROOT,'.runtime'));await mkdir(STATE,{recursive:true});
let key;try{key=await readFile(resolve(STATE,'session-key'));}catch{key=randomBytes(32);await writeFile(resolve(STATE,'session-key'),key,{mode:0o600});}
const sig=s=>createHmac('sha256',key).update(s).digest('hex');
const secureEqual=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const owners=new Map(),rate=new Map();
async function readState(owner){try{return JSON.parse(await readFile(resolve(STATE,owner+'.json'),'utf8'));}catch(e){if(e.code==='ENOENT')return core.emptyState();throw new core.ResearchError('持久库无法读取；不会创建覆盖替代数据',503);}}
async function saveState(owner,state){const p=resolve(STATE,owner+'.json');await writeFile(p+'.tmp',JSON.stringify(state),{mode:0o600});await rename(p+'.tmp',p);}
const HEAD={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"};
function send(res,status,data,type='application/json',headers={}){res.writeHead(status,{...HEAD,'Content-Type':type+'; charset=utf-8',...headers});res.end(type==='application/json'?JSON.stringify(data):data);}
const files={'/':'index.html','/index.html':'index.html','/native':'index.html','/verify':'index.html','/buddy':'index.html','/app.js':'app.js','/style.css':'style.css','/core.mjs':'core.mjs','/adapters.mjs':'adapters.mjs','/data.mjs':'data.mjs'};
async function router(req,res){const u=new URL(req.url,'http://localhost');const path=u.pathname;
 if(req.method==='GET'&&files[path]){const p=files[path];return send(res,200,await readFile(resolve(ROOT,p)),p.endsWith('.html')?'text/html':p.endsWith('.css')?'text/css':'text/javascript');}
 if(path==='/api/health')return send(res,200,{ok:true,version:core.VERSION,fuyao_configured:!!process.env.FUYAO_API_KEY,model_configured:!!process.env.OPENAI_API_KEY,storage:'server-files',model_status:'requires_key_and_separate_consent'});
 const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('il_session='))?.slice(11);let sid=cookie?.split('.')[0];const signed=cookie?.split('.')[1];if(!sid||!/^\w{64}$/.test(sid)||!secureEqual(sig(sid),signed)){sid=randomBytes(32).toString('hex');res.setHeader('Set-Cookie',`il_session=${sid}.${sig(sid)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${req.headers['x-forwarded-proto']==='https'?'; Secure':''}`);}
 const owner=sig('owner:'+sid),csrf=sig('csrf:'+sid);if(process.env.INVESTLENS_DEBUG==='1')console.error(JSON.stringify({path,has_cookie:!!cookie,valid_cookie:!!signed&&secureEqual(sig(sid),signed),has_csrf:!!req.headers['x-csrf-token'],csrf_valid:secureEqual(csrf,req.headers['x-csrf-token'])}));
 if(path==='/api/session'&&req.method==='GET')return send(res,200,{csrf,storage:'私有服务端空间',live_allowed:!!process.env.INVESTLENS_OPERATOR_TOKEN});
 const ip=req.socket.remoteAddress;const tick=Date.now();let hits=rate.get(ip)||[];hits=hits.filter(x=>tick-x<60000);if(hits.length>=90)return send(res,429,{error:'请求频率超过每分钟90次'});hits.push(tick);rate.set(ip,hits);if(rate.size>10000)rate.clear();
 let data={};if(req.method==='POST'){const origin=req.headers.origin;const expected=process.env.INVESTLENS_ORIGIN||`http://${req.headers.host}`;core.assert(!origin||origin===expected,'跨站写请求拒绝',403);core.assert(secureEqual(csrf,req.headers['x-csrf-token']),'请求缺少会话验证',403);core.assert(req.headers['content-type']?.split(';')[0]==='application/json','仅接受JSON');let n=0,buf=[];for await(const piece of req){n+=piece.length;core.assert(n<=64000,'输入超过64KB',413);buf.push(piece);}try{data=JSON.parse(Buffer.concat(buf));}catch{throw new core.ResearchError('非法JSON');}core.assert(data&&typeof data==='object'&&!Array.isArray(data),'JSON必须为对象');}
 const liveAllowed=()=>process.env.INVESTLENS_OPERATOR_TOKEN&&secureEqual(req.headers['x-investlens-operator'],process.env.INVESTLENS_OPERATOR_TOKEN);
 if(owners.get(owner))throw new core.ResearchError('此空间正在执行另一请求，请稍后重试',409);owners.set(owner,true);
 try {const state=await readState(owner);let result;
 if(path==='/api/threads'&&req.method==='GET')result=Object.values(state.threads).map(t=>({id:t.id,goal:t.goal,status:t.status,mode:t.mode,report:t.report,code:t.code,view:t.view}));
 else if(path==='/api/threads'&&req.method==='POST'){if(data.mode==='live'||data.allow_ai)core.assert(liveAllowed(),'真实供应商和模型需要私有空间操作凭证',403);result=core.createThread(state,data);}
 else if(path==='/api/tools')result=core.TOOLS;
 else {const m=path.match(/^\/api\/threads\/([a-f0-9]{16})(?:\/(\w+))?$/);core.assert(m,'路由不存在',404);const t=state.threads[m[1]];core.assert(t,'研究不存在或无权访问',404);if(t.status==='running'){t.status='blocked';t.warning='服务中断后恢复检查点；外部调用结果未知，继续前需确认可能重复只读调用或计费。';core.event(t,'recovery',t.warning,'warning');await saveState(owner,state);}const action=m[2];if(req.method==='GET'){if(action==='export'){core.assert(t.artifact,'工作稿尚未生成');return send(res,200,t.artifact.report,'text/markdown',{'Content-Disposition':`attachment; filename=research-${t.id}.md`});}core.assert(!action,'路由不存在',404);result=t;}
 else if(req.method==='POST'){if(t.mode==='live'||t.allow_ai)core.assert(liveAllowed(),'缺少私有空间操作凭证',403);if(action==='run')result=await core.runOne(t,state,{...services(process.env),beforeTool:()=>saveState(owner,state)});else if(['approve','revoke','pause','resume','confirm','edit'].includes(action))result=core.control(t,action,data);else if(action==='memory')result=core.memory(state,t,data.text);else if(action==='feedback')result=core.feedback(t,data);else if(action==='manual')result=core.manual(t,data);else if(action==='followup')result=core.createThread(state,{...t,...data,parent_id:t.id,fault:'none'});else if(action==='compare'){const other=state.threads[data.other_id];core.assert(other,'比较研究不存在',404);result=core.compare(t,other);}else throw new core.ResearchError('路由不存在',404);}else throw new core.ResearchError('请求方法无效',405);}
 if(req.method==='POST')await saveState(owner,state);send(res,200,result);
 }finally{owners.delete(owner);}
}
const server=http.createServer((req,res)=>router(req,res).catch(e=>{if(!res.headersSent)send(res,e instanceof core.ResearchError?e.status:500,{error:e instanceof core.ResearchError?e.message:'服务内部错误，未生成替代结论'});else res.end();}));
server.listen(Number(process.env.PORT||8000),process.env.HOST||'127.0.0.1',()=>console.log(`InvestLens http://${process.env.HOST||'127.0.0.1'}:${process.env.PORT||8000}`));
