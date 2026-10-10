# 第3题｜投资 X Buddy

产品：InvestLens · 投资 X Buddy
Web：https://chasezhang0-prog.github.io/investlens-research/?view=buddy
GitHub：https://github.com/chasezhang0-prog/investlens-research
README：https://github.com/chasezhang0-prog/investlens-research/blob/main/README.md
产品逻辑版本：2d749417b69c9ddd514b2ce1651a2de9221deb75。
视频：videos/第3题_投资XBuddy.mp4，75秒实际Safari产品窗口录屏，无麦克风。

## 实际产品与验证范围

本包提供可操作公网产品、完整源码、真实操作视频、原文溯源、AI使用及测试记录。它不是全部验收通过的声明：用户暂无模型与金融API密钥，运行时LLM、AI增量配对实验、扶摇/iFinD公司级独立核验尚未实际验证；更正公告自动扫描、私有云多设备同步与真实用户研究也未完成。公开版执行规则和工具，资料保存在当前浏览器。未操作考试交卷。

## 本题产品说明

# 第3题｜投资X Buddy / Agent Harness

对象为研究线程→用户确认子问题→工具计划→原始记录→证据→工作稿。UI对应可编辑子问题、步骤/权限、原值弹层、审计事件、压缩记录、记忆与产物。

内核显式注册8项工具：memory.search、snapshot.read、fuyao.indicators、document.verify、evidence.compute、llm.plan、context.compress、report.write；每项带JSON参数schema与local_read/local_compute/local_write/external_read/financial_read/external_ai权限。没有交易工具，也没有任意URL执行。

不同目标产生不同子命题；模型可选并受allowlist/结构/人工确认约束。规则发现反证且尚无现金流问题时，动态追加cash问题及证据计算步骤。这里是有限、可审计的研究Harness，不声称开放网络自主Agent或模型已验收。

审批分三种：供应商只读、官方原文联网、研究摘要外发模型。操作凭证与工具审批独立；可撤销。停止约束为调用最多1–30（默认12）、累计执行120秒、模型实测token预算1500和两次失败恢复上限。未知费率不显示费用，执行毫秒及供应商返回token分开记录。

上下文压缩保留目标、标准、事实ID/原值路径、未决证据、冲突、用户笔记与检查点，保存原始记录。前后显示实测字符数，不转换为计费token。主动保存笔记可跨研究按证券/关键词检索，父任务派生继承；笔记不是事实。

Node服务在工具开始前原子保存运行状态；重启发现未完成调用时阻断并提示需恢复、可能重复只读调用/计费。浏览器个人版持久化为IndexedDB；刷新保留任务，网页当前操作由Web Locks互斥（不支持Web Locks的浏览器以单页使用为界）。云多设备同步/多实例分布式队列尚未实现。

故障演练严格限构造数据：缺字段、矛盾值、超时、限流、中断一次恢复。不同故障不会注入官方真实数据。模型失败保留规则计划并明确记录fallback，未产生事实。


## 数据、AI与测试

真实历史样本由贵州茅台官方2024/2025年报及2023可比毛利率原文核对；数据保存原值、披露日、期间、页码与SHA256。金额单位人民币元，酒类主营毛利率与合并口径分开。开发使用Codex参与设计、代码、测试与文档；财务数据不由模型记忆生成。运行时规划采用规则。详见source/AI_USAGE_VALIDATION.md、DATA_AUDIT.md和ACCEPTANCE.md。

最终源码25/25自动测试、48/48公开披露核对通过。测试覆盖主链路、缺失、冲突、精确金额、自定义标准、有限恢复、预算、手工证据、会话隔离、CSRF、越权、并发及实际服务重启。测试替身与构造公司不作为真实供应商或LLM验收。

## 独立复现

Node.js 22或更新版本，无第三方运行依赖。在source目录运行node server.mjs，打开http://127.0.0.1:8000/?view=buddy。测试：node --test test.mjs；构建：npm run build；校验：npm run validate。

密钥仅在本机填写.env.example对应配置；不在聊天、仓库或视频输入。本包不含.env、数据库、用户持仓、完整年报PDF或实际外部凭证。压缩完整性与解压复现详见PACKAGE_CHECK.json。
