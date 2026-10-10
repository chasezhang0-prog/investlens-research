// Shared deterministic research engine. No model text can create verified facts.
export const VERSION='0.2.0';
export const stamp=()=>new Date().toISOString();
export const uid=()=>crypto.randomUUID().replaceAll('-','').slice(0,16);
export class ResearchError extends Error {constructor(message,status=400){super(message);this.status=status;}}
export const assert=(condition,message,status=400)=>{if(!condition)throw new ResearchError(message,status)};
const clone=x=>structuredClone(x);
const str=(v,min=1,max=500)=>typeof v==='string'&&v.trim().length>=min&&v.length<=max;
export const TOOLS=[
 {id:'memory.search',name:'检索已确认研究记忆',permission:'local_read',schema:{type:'object',required:['query'],properties:{query:{type:'string',maxLength:500}}}},
 {id:'snapshot.read',name:'读取公开披露核对样本',permission:'local_read',schema:{type:'object',required:['report'],properties:{report:{type:'string',pattern:'^20[0-9]{2}-[1-4]$'}}}},
 {id:'fuyao.indicators',name:'扶摇财务指标',permission:'financial_read',schema:{type:'object',required:['code','report'],properties:{code:{type:'string'},report:{type:'string'}}}},
 {id:'document.verify',name:'校验官方原文版本',permission:'external_read',schema:{type:'object',required:['report'],properties:{report:{type:'string'}}}},
 {id:'evidence.compute',name:'对齐口径并核验子命题',permission:'local_compute',schema:{type:'object',required:['thread_id'],properties:{thread_id:{type:'string'}}}},
 {id:'llm.plan',name:'模型辅助规划与补证',permission:'external_ai',schema:{type:'object',required:['thread_id'],properties:{thread_id:{type:'string'}}}},
 {id:'context.compress',name:'保留目标、引用、未决条件',permission:'local_compute',schema:{type:'object',required:['thread_id'],properties:{thread_id:{type:'string'}}}},
 {id:'report.write',name:'生成待审研究稿',permission:'local_write',schema:{type:'object',required:['thread_id'],properties:{thread_id:{type:'string'}}}}
];
export function validateTool(tool,args){const entry=TOOLS.find(x=>x.id===tool);assert(entry,'工具未注册');for(const k of entry.schema.required)assert(typeof args[k]==='string'&&args[k].length>0,'工具缺少参数：'+k);return entry;}
export function cents(v){if(v===null||v===undefined||v==='')return null;const s=String(v).replaceAll(',','');if(!/^-?\d+(\.\d{1,2})?$/.test(s))return null;const neg=s.startsWith('-'),[a,b='']=s.replace('-','').split('.');return BigInt(a)*100n*(neg?-1n:1n)+BigInt((b+'00').slice(0,2))*(neg?-1n:1n);}
export function pct(a,b){const aa=cents(a),bb=cents(b);if(aa===null||bb===null||bb<=0n)return null;const v=(aa-bb)*10000n;return Number((v+(v>=0n?bb/2n:-bb/2n))/bb)/100;}
export function amount(v){const c=cents(v);return c===null?'未提供':(Number(c)/100/1e8).toFixed(2)+' 亿元';}
function safeGoal(goal){assert(str(goal,5,500),'研究命题需为5–500字');assert(!/(保证|确保|稳赚|必定|一定).{0,8}(收益|上涨|赚钱)|自动.{0,5}(买入|卖出|下单)|应该.{0,6}(买入|卖出)|买卖建议/.test(goal),'仅支持信息核验；请改写为可证伪的研究命题。');return goal.trim();}
const Q={
 revenue:{title:'收入是否同比增长',criterion:'合并营业收入同口径同比为正',metric:'revenue',op:'increase'},
 earnings:{title:'盈利改善是否成立',criterion:'归母净利润同比为正',metric:'netProfit',op:'increase'},
 margin:{title:'主营毛利率是否改善',criterion:'酒类主营毛利率较同期提高；与综合毛利率分开',metric:'grossMargin',op:'increase'},
 cash:{title:'经营现金流是否同步改善',criterion:'合并经营活动现金流净额同比为正；排查财务子公司影响',metric:'operatingCash',op:'increase'},
 nonrecurring:{title:'扣非利润是否支持经营归因',criterion:'扣非归母利润与归母利润同向；仍不直接证明主营因果',metric:'adjustedProfit',op:'increase'},
 valuation:{title:'估值是否同口径回落',criterion:'同交易日口径的历史估值序列',metric:null,op:'decrease'},
 policy:{title:'外部变化是否存在可识别因果',criterion:'政策原文、生效日期、机制、对照与混淆因素',metric:null,op:'increase'},
 custom:{title:'自由命题还需明确可观测条件',criterion:'补充可验证指标、基准、时点和否定条件',metric:null,op:'increase'}
};
export function clarify(goal){goal=safeGoal(goal);let keys=[];
 if(/主营|盈利|利润|扣非|经营质量/.test(goal))keys.push('revenue','earnings','margin','nonrecurring');
 if(/收入|营收|销售/.test(goal)&&!keys.includes('revenue'))keys.push('revenue');
 if(/毛利/.test(goal)&&!keys.includes('margin'))keys.push('margin');
 if(/现金|回款|兑现/.test(goal))keys.push('cash');
 if(/估值|市盈率|PE|便宜/.test(goal))keys.push('valuation','earnings');
 if(/政策|产业链|关税|外部/.test(goal))keys.push('policy');
 if(!keys.length)keys=['custom'];
 const decrease=/下降|下滑|恶化|回落|减少/.test(goal)&&!/(未|没有|不).{0,2}(恶化|下降|回落)/.test(goal);
 return {origin:'rules_dynamic',questions:[...new Set(keys)].map(id=>({id,...clone(Q[id]),op:decrease&&!['valuation','policy','custom','nonrecurring'].includes(id)?'decrease':Q[id].op,criterion:decrease&&!['valuation','policy','custom','nonrecurring'].includes(id)?Q[id].criterion.replaceAll('为正','为负').replace('较同期提高','较同期下降'):Q[id].criterion,title:decrease&&!['valuation','policy','custom','nonrecurring'].includes(id)?Q[id].title.replace('同比增长','同比下降').replace('盈利改善','盈利下降').replace('是否改善','是否下降').replace('同步改善','同比下降'):Q[id].title})),ambiguities:['同一证券、可比年报期与合并范围是否一致？','事实方向能检验，主营归因仍需成本、费用及分部材料。'],revised_goal:goal};
}
export function emptyState(){return {threads:{},memories:[],rate:[],created_at:stamp()};}
export function event(t,tool,detail,level='info',ms=0){t.events.push({id:uid(),at:stamp(),tool,detail,level,ms});t.events=t.events.slice(-100);}
function step(tool,args,reason){validateTool(tool,args);return {id:uid(),tool,args,reason,status:'pending',attempts:0,ms:0};}
export function plan(t){const p=[step('memory.search',{query:t.goal},'复用研究者明确保存的上下文')];
 if(t.allow_ai)p.push(step('llm.plan',{thread_id:t.id},'语义规划仅提出问题，输出需要人工确认'));
 p.push(step(t.mode==='live'?'fuyao.indicators':'snapshot.read',t.mode==='live'?{code:t.code,report:t.report}:{report:t.report},'读取本期与可比期；缺失不补值'));
 if(t.verify_document&&t.mode==='public')p.push(step('document.verify',{report:t.report},'重新获取官方PDF并校验SHA256，不接受任意URL'));
 p.push(step('evidence.compute',{thread_id:t.id},'按每个子命题的标准计算并保留正反未知'));
 p.push(step('context.compress',{thread_id:t.id},'保留目标、证据引用、异议和恢复检查点'));
 p.push(step('report.write',{thread_id:t.id},'生成待人工审核的工作稿'));
 return p;
}
export function createThread(state,opts={}){const goal=safeGoal(opts.goal);const mode=opts.mode||'public';assert(['public','demo','live'].includes(mode),'数据模式无效');let report=opts.report||'2024-4';const years=[...new Set((goal.match(/20\d{2}(?=年)/g)||[]))];if(opts.parent_id&&mode==='public'&&years.length===1&&['2024','2025'].includes(years[0]))report=years[0]+'-4';assert(years.length!==1||years[0]===report.split('-')[0],'命题年份与所选报告期不同，请修订命题或切换期间');assert(/^20\d{2}-[1-4]$/.test(report),'报告期格式无效');assert(mode==='live'||['2024-4','2025-4'].includes(report),'当前公开样本只支持2024/2025年报');assert(mode!=='demo'||report==='2025-4','构造样本仅支持2025/2024对照');const code=opts.code||(mode==='demo'?'DEMO.A':'600519.SH');assert(mode==='demo'?code==='DEMO.A':/^\d{6}\.(SH|SZ|BJ)$/.test(code),'证券代码不匹配');assert(mode!=='public'||code==='600519.SH','公开样本仅对应贵州茅台');
 const asof=opts.asof||'2026-10-10';assert(/^\d{4}-\d{2}-\d{2}$/.test(asof)&&!Number.isNaN(Date.parse(asof)),'截止日期无效');assert(new Date(asof).toISOString().slice(0,10)===asof,'截止日期不存在');
 assert(['none','missing','conflict','timeout','rate_limit','crash_once'].includes(opts.fault||'none'),'故障类型无效');assert(mode==='demo'||!opts.fault||opts.fault==='none','故障注入仅限构造样本');for(const k of ['allow_ai','verify_document'])assert(opts[k]===undefined||typeof opts[k]==='boolean','授权参数必须为布尔值');
 assert(Object.keys(state.threads).length<100,'此空间研究任务已达100个上限',429);
 const budget=Number(opts.max_calls??12);assert(Number.isInteger(budget)&&budget>=1&&budget<=30,'调用预算需为1–30');
 const c=clarify(goal);const t={id:uid(),parent_id:opts.parent_id||null,view:opts.view||'verify',goal,original_goal:goal,mode,code,report,asof,scope:'合并年报；归母口径单独标识',created_at:stamp(),updated_at:stamp(),status:'awaiting_plan',questions:c.questions,clarification:c,plan_origin:c.origin,steps:[],cursor:0,raw:[],evidence:[],events:[],memories:[],feedback:[],conflicts:[],artifact:null,compression:null,budget:{max_calls:budget,max_ms:120000,max_model_tokens:1500,used_calls:0,elapsed_ms:0,model_tokens:0,cost:null,cost_note:'未配置费率；不推算账单'},approvals:{external_read:false,financial_read:false,external_ai:false},allow_ai:opts.allow_ai===true,verify_document:opts.verify_document===true,fault:opts.fault||'none',warning:'',recovery_count:0,revision:0};
 if(t.parent_id){assert(state.threads[t.parent_id],'父任务不存在',404);t.memories=clone(state.threads[t.parent_id].memories);}
 t.steps=plan(t);event(t,'planner',`${t.steps.length}步建议，${t.questions.length}个子命题；来源 ${t.plan_origin}`);state.threads[t.id]=t;return t;
}
export function editPlan(t,data){assert(t.status==='awaiting_plan','只能在执行前修改计划');if(data.goal){t.goal=safeGoal(data.goal);const c=clarify(t.goal);t.questions=c.questions;t.clarification=c;}
 if(data.questions){assert(Array.isArray(data.questions)&&data.questions.length<=10&&data.questions.length>=1,'子命题需1–10项');t.questions=data.questions.map(q=>{assert(Q[q.id]&&str(q.title,2,140)&&str(q.criterion,2,300)&&['increase','decrease','stable'].includes(q.op),'子命题参数无效');return {...clone(Q[q.id]),...q,metric:Q[q.id].metric,custom_criterion:![Q[q.id].criterion,Q[q.id].criterion.replaceAll('为正','为负').replace('较同期提高','较同期下降')].includes(q.criterion)};});}
 t.steps=plan(t);event(t,'planner','研究者修订命题与判定标准；尚未采纳为事实');return t;
}
export function confirmPlan(t){assert(['awaiting_plan','awaiting_model_review'].includes(t.status),'当前计划无需确认');t.status='ready';event(t,'approval','研究者确认计划，第三方调用权限仍独立控制');return t;}
function ref(raw,path,page){const [,which,metric]=path.split('.');const point=raw[which]||{};const locator=point.metricSources?.[metric==='grossMargin'?'grossMargin':'financials'];const doc=[raw.document,...(raw.supplementalDocuments||[])].find(d=>d?.url===locator?.url)||raw.document;return {raw_id:raw.id,json_path:path,report:point.year?`${point.year}-4`:raw.report,source:raw.source,url:locator?.url||doc?.url||null,page:locator?.page||page||doc?.page_financials||null,published_at:doc?.published_at||null,retrieved_at:raw.retrieved_at,observed_at:point.period_end||raw.report.replace('-4','-12-31'),scope:metric==='grossMargin'?'酒类主营业务毛利率':point.scope||raw.scope,unit:metric==='grossMargin'?'百分数':raw.unit,currency:raw.currency,sha256:doc?.sha256||null,version:'已核对发布版；未自动扫描后续更正公告'};}
function ev(t,q,stance,title,detail,refs=[],extra={}){const e={id:uid(),question_id:q.id,criterion:q.criterion,stance,title,detail,refs,verified:refs.length>0&&stance!=='unknown',kind:t.mode==='demo'?'fictional':refs.length?'disclosed_fact':'unknown',caveat:'证据方向针对子命题；不代表评级、投资建议或因果确认。',...extra};t.evidence.push(e);return e;}
function direction(v,q){if(v===null)return 'unknown';return (q.op==='decrease'?v<0:q.op==='stable'?Math.abs(v)<0.01:v>0)?'support':'oppose';}
export function compute(t){t.evidence=t.evidence.filter(e=>e.kind==='manual');t.conflicts=[];const r=t.raw.find(x=>x.kind==='financials');
 for(const q of t.questions){if(!r){ev(t,q,'unknown',q.title,'缺少财务原始数据');continue;}if(!q.metric){ev(t,q,'unknown',q.title,'现有工具未取得所需估值序列、政策对照或自定义指标，不以财务数值替代。');continue;}
 if(q.custom_criterion){ev(t,q,'unknown',q.title,'自定义判定标准尚未自动映射到确定性公式；请人工核对，不套用默认阈值。');continue;}
 if(r.metrics){const fields={revenue:'operating_income_yoy_growth_ratio',earnings:'net_profit_yoy_growth_ratio',cash:'operating_cash_net_yoy_growth_ratio'};const key=fields[q.id];const m=r.metrics[key];if(!key||!m||m.value===null||r.collisions?.includes(key)){ev(t,q,'unknown',q.title,'供应商未提供所需同口径原值或存在重复字段冲突。');continue;}const v=Number(m.value);const rr=ref(r,m.json_path);ev(t,q,'unknown',q.title,`接口原始值 ${m.value}%；披露日未提供，研究截止时的可知性未核验。`,[rr],{verified:false,metric:key,value:Number.isFinite(v)?v:null});continue;}
 const a=r.current[q.metric],b=r.prior[q.metric];const collision=r.collisions?.includes(q.metric);const refs=[ref(r,'$.current.'+q.metric,q.metric==='grossMargin'?r.document?.page_margin:null),ref(r,'$.prior.'+q.metric,q.metric==='grossMargin'?r.document?.page_margin:null)];
 const unknown=(why)=>ev(t,q,'unknown',q.title,why,refs,{verified:false});
 if(collision){t.conflicts.push({question_id:q.id,type:'same_metric_conflict',resolution:'隔离冲突字段，要求人工选定可信版本；不平均',values:r.conflict_values});unknown('同指标同期间数值冲突；该字段停用。');continue;}
 if(a===null||a===undefined||b===null||b===undefined){unknown('缺失原值；不补零、不用上期值冒充本期。');continue;}
 if(refs.some(x=>x.published_at&&x.published_at>t.asof)){unknown('披露日晚于研究截止日，属于当时不可知信息，停用。');continue;}
 const value=q.metric==='grossMargin'?Number(cents(a)-cents(b))/100:pct(a,b);
 if(value===null){unknown('基准为零、负值或数值格式不可靠；不能使用常规同比。');continue;}
 const detail=q.metric==='grossMargin'?`本期 ${a}%，可比期 ${b}%，差 ${value.toFixed(2)} 个百分点；酒类主营口径。`:`本期 ${amount(a)}，可比期 ${amount(b)}，同比 ${value.toFixed(2)}%；原始金额按人民币元保存。`;
 const alignment=q.id==='nonrecurring'?pct(r.current.netProfit,r.prior.netProfit):null;const stance=q.id==='nonrecurring'?(alignment===null?'unknown':Math.sign(alignment)===Math.sign(value)?'support':'oppose'):direction(value,q);ev(t,q,stance,q.title,detail+(q.id==='nonrecurring'?` 归母同比 ${alignment===null?'未提供':alignment.toFixed(2)+'%'}；这里只检查方向是否一致。`:''),refs,{metric:q.metric,value,unit:q.metric==='grossMargin'?'百分点':'%',caveat:q.id==='cash'?'合并现金流含财务子公司；不能直接归因为酒类回款或使用其与归母利润的比值作现金质量阈值。':q.id==='nonrecurring'?'扣非并非主营业务利润；还需分部、成本、费用与合并范围核验。':'同期同口径；事实方向不直接证明主营归因。'});
 }
 if(t.questions.some(q=>q.id==='cash')&&r?.document){ev(t,{id:'cash',criterion:'核对现金流变化原因'},'unknown','现金流解释与数值方向需共同保留',r.managementExplanation?.operatingCash||'财务子公司存款变化会影响合并经营现金流，不能据总额直接判断客户回款。',[ref(r,'$.managementExplanation.operatingCash',r.document.page_cash_explanation)],{kind:'management_explanation',verified:false,caveat:'管理层解释来自同一公司披露，不是独立第三方事实。'});}
 if(t.questions.some(q=>q.id==='earnings'||q.id==='nonrecurring'))ev(t,{id:'nonrecurring',criterion:'识别因果与相关的边界'},'unknown','主营贡献仍需进一步核实','即使归母、扣非、收入与毛利同向，也仅提供经营线索；尚未取得利润归因桥、费用拆分与独立供应商复核。');
 // Adaptive plan: when warning signals appear, add a cash check before compression.
 if(t.evidence.some(e=>e.stance==='oppose')&&!t.questions.some(q=>q.id==='cash')&&!t.adaptive_cash_added){t.questions.push({id:'cash',...clone(Q.cash)});t.adaptive_cash_added=true;t.steps.splice(t.cursor+1,0,step('evidence.compute',{thread_id:t.id},'发现相反经营信号，追加现金流交叉检查'));event(t,'planner','出现反证后追加现金流核验，计划已动态扩展');}
 event(t,'evidence.compute',`核验 ${t.evidence.length} 条证据，隔离 ${t.conflicts.length} 个冲突`);return t.evidence;
}
export function compress(t){const before=JSON.stringify({events:t.events,raw:t.raw,evidence:t.evidence,memories:t.memories});const retained={goal:t.goal,report:t.report,asof:t.asof,questions:t.questions.map(q=>({id:q.id,criterion:q.criterion})),facts:t.evidence.filter(e=>e.verified).map(e=>({id:e.id,stance:e.stance,refs:e.refs.map(r=>({raw_id:r.raw_id,path:r.json_path}))})),unresolved:t.evidence.filter(e=>!e.verified||e.stance==='unknown').map(e=>({id:e.id,title:e.title})),conflicts:t.conflicts,memories:t.memories.map(m=>({id:m.id,text:m.text})),checkpoint:t.cursor};const after=JSON.stringify(retained);t.compression={algorithm:'结构化摘要，保留证据ID与原始库引用',before_chars:before.length,after_chars:after.length,retained,originals_preserved:true,token_estimate_note:'字符数是实测；不是token或计费'};event(t,'context.compress',`上下文 ${before.length} → ${after.length} 字符，原始记录仍保留`);return t.compression;}
export function report(t){const label={public:'官方公开披露核对样本（人工提取、历史数据）',demo:'构造示例（非真实企业）',live:'扶摇接口（以实际返回为准）'}[t.mode];const valid=t.evidence.filter(e=>e.verified&&e.kind!=='manual');const verdict=valid.length===0?'当前缺少满足标准的可核验事实，不能确认或否定核心命题。':valid.some(e=>e.question_id==='earnings'&&e.stance==='oppose')?'盈利改善这一前提受到现有披露反证；主营归因不能据此成立。':valid.some(e=>e.stance==='oppose')?'存在相反方向的经营信号，核心归因仍不能确认。':'现有证据支持部分经营子命题，核心归因仍需原始明细和反证核验。';
 const lines=[`# 研究工作稿｜${t.goal}`,'',`数据：${label}`,`证券：${t.code} ｜ 报告期：${t.report} ｜ 研究截止：${t.asof}`,`生成：${stamp()} ｜ 规划：${t.plan_origin}`,'',`## 当前判断`,verdict,'支持/反对针对明确子命题，不采用票数得出投资评级。','',`## 证据`];
 for(const e of t.evidence){lines.push(`### ${{support:'支持',oppose:'反对',unknown:'无法验证'}[e.stance]}｜${e.title}`,e.detail,`判定标准：${e.criterion||'待研究者明确'}`,`边界：${e.caveat}`);for(const r of e.refs)lines.push(`来源：${r.source}；报告期 ${r.report}；披露 ${r.published_at||'未提供'}；获取 ${r.retrieved_at}；口径 ${r.scope}；单位 ${r.unit}`,`原始记录 ${r.raw_id} / ${r.json_path}${r.url?`；[原文第${r.page||'?'}页](${r.url}#page=${r.page||1})`:''}`);lines.push('');}
 lines.push('## 信息变化会怎样影响判断','扣非利润、费用与成本桥、分部收入或现金流解释发生变化时重新核验；跨期/单位/合并范围不同的值不能直接合并。','同一公司不同期、不同网页镜像仍属于同一披露来源；不声称独立供应商双重验证。','尚未自动遍历更正公告；本样本不能当实时资料。','',`## 人工复核`,...t.feedback.map(f=>`${f.evidence_id}: ${f.decision} / ${f.note}`),'',`## 研究记忆（非已核事实）`,...t.memories.map(m=>m.text),'',`## 模型与成本`,t.model?.origin==='llm'?`模型实际调用 ${t.model.model}；服务返回tokens ${t.model.tokens??'未提供'}`:'运行时模型未调用；规则规划/计算不能视为模型效果验证。',`截至开始生成工作稿累计工具 ${t.budget.elapsed_ms} ms；调用 ${t.budget.used_calls}；费用 ${t.budget.cost_note}`,'','仅用于信息整理与研究核验，不提供买卖建议或自动交易。');
 t.artifact={created_at:t.artifact?.created_at||stamp(),revised_at:stamp(),verdict,report:lines.join('\n'),review:t.feedback.length?'reviewed':'awaiting_human_review'};event(t,'report.write','研究工作稿已生成，等待研究者核查');return t.artifact;
}
export async function runOne(t,state,services){assert(t.status==='ready','请先确认计划、批准外部权限或恢复任务');const s=t.steps[t.cursor];assert(s,'任务已结束');if(t.budget.used_calls>=t.budget.max_calls||t.budget.elapsed_ms>=t.budget.max_ms||t.budget.model_tokens>=t.budget.max_model_tokens){t.status='stopped';t.warning='达到调用预算或累计执行时限；已停止。';event(t,'budget',t.warning,'warning');return t;}
 const tool=validateTool(s.tool,s.args);if(['external_read','financial_read','external_ai'].includes(tool.permission)&&!t.approvals[tool.permission]){t.status='awaiting_approval';t.pending_permission=tool.permission;t.warning=`待批准：${tool.name}，仅此任务；外部调用可能产生费用或传输摘要。`;event(t,'approval',t.warning,'warning');return t;}
 const start=performance.now();s.status='running';t.status='running';s.attempts++;t.budget.used_calls++;event(t,s.tool,'开始执行');
 try {if(services.beforeTool)await services.beforeTool(t);if(['timeout','rate_limit'].includes(t.fault)&&['snapshot.read','fuyao.indicators'].includes(s.tool))throw new ResearchError(t.fault==='timeout'?'故障演练：工具超时，保留原检查点':'故障演练：上游限流，未获取数据');if(t.fault==='crash_once'&&['snapshot.read','fuyao.indicators'].includes(s.tool)&&s.attempts===1)throw new ResearchError('故障演练：执行中断；恢复后从此步骤继续');
 switch(s.tool){case 'memory.search':{const terms=t.goal.match(/[\u4e00-\u9fff]{2,4}/g)||[];const found=state.memories.filter(m=>m.code===t.code||terms.some(x=>m.text.includes(x))).slice(-20);t.memories=[...new Map([...t.memories,...clone(found)].map(x=>[x.id,x])).values()];event(t,s.tool,`找到 ${found.length} 条用户确认笔记；非事实核验`);break;}
 case 'snapshot.read':{const out=await services.snapshot(t);t.raw=[...t.raw.filter(r=>r.kind!=='financials'),{id:uid(),kind:'financials',...clone(out)}];break;}
 case 'fuyao.indicators':{const out=await services.financial(t);t.raw=[...t.raw.filter(r=>r.kind!=='financials'),{id:uid(),kind:'financials',...out}];break;}
 case 'document.verify':{const out=await services.document(t);t.raw.push({id:uid(),kind:'document_verification',...out});break;}
 case 'llm.plan':{try{const output=await services.model(t);assert(Array.isArray(output.questions)&&output.questions.length<=6,'模型结构不合规');assert(output.questions.every(q=>Q[q.id]&&str(q.title,2,140)),'模型提出未支持工具的命题');t.questions=output.questions.map(q=>({...clone(Q[q.id]),id:q.id,title:q.title}));t.plan_origin='llm_assisted';t.model={origin:'llm',model:output.model,tokens:output.tokens,questions:output.questions};t.budget.model_tokens=output.tokens||0;assert(t.budget.model_tokens<=t.budget.max_model_tokens,'模型响应超过预算；停止后续外部调用');t.status='awaiting_model_review';event(t,s.tool,'模型提出子问题，必须人工复核后继续');}catch(e){t.model={origin:'rules_fallback',error:'模型不可用或输出校验失败'};event(t,s.tool,'模型不可用，保持规则计划；未生成模型事实','warning');}break;}
 case 'evidence.compute':compute(t);break;case 'context.compress':compress(t);break;case 'report.write':report(t);break;
 }
 s.status='done';t.cursor++;t.recovery_count=0;t.warning='';if(t.cursor>=t.steps.length)t.status='completed';else if(t.status!=='awaiting_model_review')t.status='ready';
 }catch(e){s.status='failed';t.status='blocked';t.warning=e instanceof ResearchError?e.message:'工具调用失败，未取得可验证输出。';event(t,s.tool,t.warning,'error');}
 const ms=Math.round(performance.now()-start);s.ms+=ms;t.budget.elapsed_ms+=ms;t.updated_at=stamp();t.revision++;event(t,s.tool,`检查点 ${t.cursor}/${t.steps.length}`,t.status==='blocked'?'warning':'info',ms);return t;
}
export function control(t,action,data={}){if(action==='approve'){assert(t.status==='awaiting_approval','没有待批准的外部调用');t.approvals[t.pending_permission]=true;event(t,'approval',`研究者允许 ${t.pending_permission}，仅此任务、可撤销`);t.pending_permission=null;t.status='ready';}
 else if(action==='revoke'){for(const k of Object.keys(t.approvals))t.approvals[k]=false;event(t,'approval','撤销全部第三方调用权限');}
 else if(action==='pause'){assert(t.status==='ready','只能暂停就绪任务');t.status='paused';event(t,'control','暂停，检查点已保存');}
 else if(action==='resume'){assert(['blocked','paused'].includes(t.status),'此状态无需恢复');assert(t.recovery_count<2,'达到2次恢复上限');t.recovery_count++;t.status='ready';event(t,'control','从持久化检查点恢复，不重做已完成步骤');}
 else if(action==='confirm')return confirmPlan(t);
 else if(action==='edit')return editPlan(t,data);
 else throw new ResearchError('操作无效');return t;}
export function memory(state,t,text){assert(str(text,1,500),'笔记需1–500字');const m={id:uid(),thread_id:t.id,code:t.code,text:text.trim(),at:stamp(),confirmed:true};state.memories.push(m);t.memories.push(m);event(t,'memory','用户主动保存研究笔记');if(t.artifact)report(t);return t;}
export function feedback(t,data){assert(t.evidence.some(e=>e.id===data.evidence_id),'证据不存在');assert(['accept','reject','needs_review'].includes(data.decision)&&str(data.note||'核对',1,500),'复核参数无效');t.feedback=t.feedback.filter(x=>x.evidence_id!==data.evidence_id);t.feedback.push({...data,at:stamp()});if(t.artifact)report(t);return t;}
export function manual(t,data){assert(str(data.title,2,140)&&str(data.detail,2,800)&&['support','oppose','unknown'].includes(data.stance),'材料参数无效');assert(str(data.source,1,500),'需要来源');const q={id:'custom',criterion:'人工待核材料'};ev(t,q,data.stance,data.title,data.detail,[],{kind:'manual',verified:false,caveat:'来源和文字由用户提供，未自动取得原件，不参与自动事实裁决。',manual_source:data.source});event(t,'manual','收录未核验材料');if(t.artifact)report(t);return t;}
export function compare(a,b){assert(a.code===b.code&&a.mode===b.mode,'比较需相同证券与数据模式');return {left:a.id,right:b.id,periods:[a.report,b.report],same_period:a.report===b.report,differences:a.evidence.filter(e=>e.metric).map(e=>({metric:e.metric,left:e.value,right:b.evidence.find(f=>f.metric===e.metric)?.value??null,unit:e.unit})),note:'跨期只比较相同定义的变化；构造与真实样本不能混合。'};}
