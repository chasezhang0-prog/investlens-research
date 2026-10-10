# InvestLens 接管记录

2026-10-10（上海）读取完整交接提示词、原题、验收矩阵、现状清单、旧源码及历史对话。原工程18/18单元测试通过；HTTP smoke实际通过（需允许本机监听）。原工程仅固定5步，未有公网、GitHub、原文、真实供应商或模型验收。

重构原因：保留旧Python版本于交接包，使用共享JavaScript确定性执行内核，支持Node私有服务、无秘密的浏览器个人空间，以及可部署Worker构建。目标是让评委无需密钥即可操作公开年报样本；供应商和模型调用保留服务端及权限边界。

用户明确确认目前没有API密钥。不得标记扶摇/模型实际成功。

Sites注册尝试返回传输失败，未返回project_id；list_sites实际返回空列表。禁止假造Site ID或反复创建。将继续本机开发与其他可用发布途径。

## Free AI validation in progress, 2026-10-11
User requires actual validation before replacement ZIPs and asks for zero paid APIs. Original questions prefer Fuyao; they do not mandate it. Prior acceptance overstated independent supplier/private cloud/user outcome requirements. Real official 2024/2025 PDF downloads and SHA checks passed in artifacts/verification/free-public-source-check.json.
V0.3 edits include browser WebLLM 0.2.85 + Qwen3-0.6B, real model usage metadata, canonical questions, model review editing, budget/permission guards and public running-state recovery. 29 tests passed before latest fiscal-edit test. Model not yet inferred. Browser direct HuggingFace download timed out despite Chrome WebGPU/f16 passing. Standard Python urllib download works; first 77,791,232-byte shard downloaded and official SHA verified. Model helper port8005 (exec19306), preview old8002 (62918) and obsolete8004 (59762). Diagnostic on static8001 ai-check.html uses helper8005. Chrome CUA variable chromeAI; helper indexMatch. Model weights preparing: 74.2 /319.8 MB observed. SDK bundled webllm.js 5.8 MB, licenses present; weights in .model-cache excluded. Need actual model inference+6 cases, main app E2E, new videos, publish v0.3 and rebuild all packages. Old ZIPs remain v0.2 and must not be mislabeled fully verified. Core cloud consent now derives actual services.model_provider, not caller option; cloud adapter overwrites provider metadata.

## 2026-10-11｜免费真实AI验证与原题门槛纠正

原题要求金融数据“优先使用”扶摇/iFinD，并未要求购买接口、私有云同步或已完成真实用户盲审。旧内部矩阵把这些扩展当硬门槛，已纠正。真实公司数据沿用官方年报，新增两个官方PDF的实际联网下载与SHA匹配证明。

新接入WebLLM 0.2.85与Qwen3-0.6B浏览器GPU模型，无模型密钥或付费推理。浏览器直连权重超时，本机标准Python下载可用；固定官方模型文件、完整大小和SHA校验的本机助手解决传输，输入仍仅在浏览器推理，不修改TLS。路径fileURLToPath修正中文目录编码错误。9片335372288字节官方SHA均通过。

真实首轮测试记录低覆盖与误提项；缩小生成协议后重测，再对预先保存的6个改写问题实测。模型相关指标9/9、建议21项，准确率42.9%，两条下降方向均误判，完整保留而非筛选结果。界面新增计划复核增删、漏项补充和方向修订。JSON标题固定为应用标签，原始模型仅生成指标ID和方向。

30项自动测试、构建与产物语法通过。首次旧浏览器缓存使本地计划误进入云端审批路径；刷新全部资源后实际本地运行通过，入口与核心模块带版本参数。新版公网模型首次14708ms成功加载，实际311 tokens规划停在人工复核，补扣非、反证追加现金流、证据与工作稿已执行。

源码d72371a1b2ac670dbbd04ab88e54e165684966cb已发布，24项SHA与本机一致；Git读取工具失败后直接读取公开GitHub原始文件逐项核验。说明文档同步、另外两入口新版端到端、三个新视频和正式ZIP仍待继续。Mac自动锁屏中断新录制，已请求手动解锁，没有使用未完成录屏冒充新成片。

解锁后集中完成三个v0.3公网流程。第1题真实311 tokens、人工补项、反证追加、逐条复核、记忆、对照与导出；第2题2024/2025追问和已完成研究比较、官方第6页、待核材料和导出；第3题344 tokens、构造中断、刷新恢复、暂停继续、压缩与导出。首次比较选择不完整草稿产生未知，改选完成稿后五字段实际数值通过；视频保留修正过程。三段新视频无声、产品区域裁切和全片解码；未将失败旧录制当作最终视频。

功能与说明提交8067f9699839e0c35081822a5fa7cdc121827509公开读取，24源码与11说明文件SHA一致，三个入口HTTP200。三份v0.3候选ZIP已分别真正解压，各30项测试、构建与产物校验通过；逐文件SHA、CRC和小于30MB均通过。最终验收矩阵更新为三题在明确范围内全部PASS；免费模型错误和未做扩展持续披露，不声称无审核正确率、考试评分保证或代交卷。
