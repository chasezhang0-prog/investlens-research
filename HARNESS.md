# 第3题｜投资X Buddy / Agent Harness

对象为研究线程→用户确认子问题→工具计划→原始记录→证据→工作稿。UI对应可编辑子问题、步骤/权限、原值弹层、审计事件、压缩记录、记忆与产物。

内核显式注册8项工具：memory.search、snapshot.read、fuyao.indicators、document.verify、evidence.compute、llm.plan、context.compress、report.write；每项带JSON参数schema与local_read/local_compute/local_write/external_read/financial_read/external_ai权限。没有交易工具，也没有任意URL执行。

不同目标产生不同子命题；模型可选并受allowlist/结构/人工确认约束。规则发现反证且尚无现金流问题时，动态追加cash问题及证据计算步骤。这里是有限、可审计的研究Harness，不声称开放网络自主Agent或模型已验收。

审批分三种：供应商只读、官方原文联网、研究摘要外发模型。操作凭证与工具审批独立；可撤销。停止约束为调用最多1–30（默认12）、累计执行120秒、模型实测token预算1500和两次失败恢复上限。未知费率不显示费用，执行毫秒及供应商返回token分开记录。

上下文压缩保留目标、标准、事实ID/原值路径、未决证据、冲突、用户笔记与检查点，保存原始记录。前后显示实测字符数，不转换为计费token。主动保存笔记可跨研究按证券/关键词检索，父任务派生继承；笔记不是事实。

Node服务在工具开始前原子保存运行状态；重启发现未完成调用时阻断并提示需恢复、可能重复只读调用/计费。浏览器个人版持久化为IndexedDB；刷新保留任务，网页当前操作由Web Locks互斥（不支持Web Locks的浏览器以单页使用为界）。云多设备同步/多实例分布式队列尚未实现。

故障演练严格限构造数据：缺字段、矛盾值、超时、限流、中断一次恢复。不同故障不会注入官方真实数据。模型失败保留规则计划并明确记录fallback，未产生事实。
