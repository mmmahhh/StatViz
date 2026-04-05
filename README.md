# StatViz

**StatViz** (原名 MiniTab-Lite) 是一款轻量级、基于 Web 的数据统计与可视化分析工具。它旨在为用户提供类似 Minitab 的核心统计功能，同时拥有现代化的 Web 交互体验。

![StatViz Banner](https://img.shields.io/badge/Status-Beta-blue?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Tech-React%20%7C%20TypeScript%20%7C%20Vite-61dafb?style=for-the-badge)

## ✨ 功能特性

- 📊 **多维数据可视化**：支持箱线图 (Box Plot)、直方图 (Histogram) 等专业统计图表。
- 📈 **描述性统计分析**：自动计算均值、标准差、中位数、四分位数等关键统计指标。
- 📂 **灵活的数据导入**：支持 CSV、Excel 等多种格式的文件解析。
- 🌍 **多语言支持**：内置中英文双语界面 (i18n)。
- ⚡ **实时响应**：基于 Zustand 构建高效的全局状态管理，实现数据的毫秒级更新。

## 🛠️ 技术栈

- **框架**: [React 18](https://reactjs.org/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **图表库**: [D3.js](https://d3js.org/)
- **UI 组件库**: [Ant Design 5](https://ant.design/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
- **测试**: [Vitest](https://vitest.dev/)

---

## 📖 操作手册 (User Manual)

### 1. 环境准备
确保您的开发环境满足以下要求：
- **Node.js**: v18.0.0+
- **包管理器**: npm 或 yarn

### 2. 🚀 快速开始
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm run test

# 构建生产版本
npm run build
```

### 3. 📂 项目核心模块说明
- **数据导入 (`src/utils/fileParser.ts`)**: 处理 CSV 和 Excel 解析。
- **统计算法 (`src/utils/stats.ts`)**: 核心描述性统计逻辑。
- **可视化组件 (`src/components/charts/`)**: D3.js 图表实现方案。
- **状态中心 (`src/store/useDataStore.ts`)**: 基于 Zustand 的轻量级状态流。

### 4. ⌨️ 开发规范
- **i18n**: 翻译文件位于 `src/locales/`。
- **Lint**: 提交前请运行 `npm run lint` 确保代码风格一致。

---

## 🛡️ 维护与安全建议

- **数据隐私**: 严禁将包含真实敏感信息的 `test_data/` 上传至公开仓库。
- **仓库可见性**: 如需处理机密数据，请使用 GitHub CLI 将仓库设为私有：
  ```bash
  gh repo edit --visibility private
  ```

## 📄 开源协议

本项目采用 MIT 协议。
