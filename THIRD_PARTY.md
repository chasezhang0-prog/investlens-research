# 第三方软件与公开模型

本项目原创代码采用 MIT 许可证（LICENSE）；第三方组件保留各自许可。

- WebLLM 0.2.85：MLC AI，Apache-2.0。随包保留 WEBLLM_LICENSE.txt。[官方源码](https://github.com/mlc-ai/web-llm)、[官方文档](https://webllm.mlc.ai/docs/)。SDK 来自标准 npm 包，经 esbuild 构建为 webllm.js；package-lock.json 保留包完整性值。
- loglevel：MIT。SDK 依赖的许可正文见 LOGLEVEL_LICENSE.txt。
- Qwen3-0.6B：Qwen，Apache-2.0。[原模型](https://huggingface.co/Qwen/Qwen3-0.6B)、[MLC 转换版](https://huggingface.co/mlc-ai/Qwen3-0.6B-q4f16_1-MLC)。固定版本及 9 片官方 LFS SHA256 在 model-files.json；权重不随提交包分发，首次使用从公开官方仓库下载。
- WebGPU 编译资源由 [MLC AI 官方公开库](https://github.com/mlc-ai/binary-mlc-llm-libs)提供。不更改浏览器或系统证书验证。

权重下载约 319.8 MiB，模型在本机浏览器推理。API 按次费用为 0，不代表设备、网络或电费为零。下载失败或 GPU 不兼容时明确提示失败，规则路径仍可检查。
