# StatViz (Stat-Insight)

**StatViz** 是一款专业、轻量级且高度互动的 Web 端数据统计与质量可视化分析工具。它将传统的统计学分析与现代大语言模型 (LLM) 相结合，旨在为质量工程师、数据分析师提供“开箱即用”的深度数据洞察。

![StatViz Banner](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Tech-React%20%7C%20TypeScript%20%7C%20Vite-61dafb?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/AI-Powered-purple?style=for-the-badge)

## 🚀 核心功能升级

- 🤖 **AI 深度质量诊断**：
  - 接入真实 LLM API（支持 **MiniMax**, **DeepSeek**, **OpenAI**, **SiliconFlow** 等）。
  - 自动剥离思考过程 (`<think>`)，精准提取统计洞察 JSON。
  - 基于均值、标准差、偏度等统计指标，自动生成自然语言形式的“正态性”、“稳定性”及“异常值”分析报告。
- 📊 **“上图下表”专业布局**：
  - 采用垂直流式布局，上方展示动态统计图表与 AI 报告，下方平铺显示所有数据集。
  - 支持自动滚动回顶部的交互反馈，确保分析结果实时可见。
- 📝 **多数据集实时编辑**：
  - 同时加载并显示多份文件数据（如白班 vs 夜班）。
  - **单元格级实时编辑**：直接点击表格即可修改数据，图表与 AI 分析将毫秒级同步更新。
- 📄 **全量 PDF 导出报告**：
  - 支持 **A4 自动分页** 技术，彻底解决长报告截断问题。
  - 导出模式下自动渲染全量原始数据，确保生成的 PDF 报告包含 100% 的数据细节。
- 📈 **专业统计图表**：
  - 基于 D3.js 实现的高性能箱线图 (Box Plot) 和直方图 (Histogram)。
  - 支持异常值检测 (IQR)、正态拟合曲线及多数据集对比。

## ⚙️ 模型配置指南

点击顶部导航栏右上角的 **⚙️ (AI 设置)** 图标：
1. **厂商预设**：一键切换 OpenAI、DeepSeek、MiniMax (abab6.5s) 或 SiliconFlow。
2. **API 凭证**：填入您的 API Key。数据仅保存在浏览器本地 `localStorage`，确保安全。
3. **自定义**：支持任何兼容 OpenAI 接口规范的自定义 Base URL。

## 🛠️ 开发与部署

### 1. 快速启动
```bash
# 安装依赖 (新增 jspdf, html2canvas 等)
npm install

# 启动开发服务器
npm run dev

# 运行测试与规范检查
npm test
npm run lint
```

### 2. 技术栈
- **核心框架**: React 18 + TypeScript + Vite
- **状态管理**: Zustand (结合 `persist` 中间件实现配置持久化)
- **图表引擎**: D3.js
- **导出方案**: html2canvas + jsPDF
- **样式方案**: Tailwind CSS + Lucide Icons

---

## 📖 核心目录结构
- `src/utils/aiAnalyst.ts`: LLM 接口封装与智能过滤算法。
- `src/components/settings/SettingsModal.tsx`: 多厂商 API 配置中心。
- `src/store/useDataStore.ts`: 支持实时编辑的全局数据仓库。
- `src/locales/`: 完整的国际化支持 (ZH/EN)。

## 📄 许可协议
本项目基于 MIT 协议开源。
