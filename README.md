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

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 运行测试
```bash
npm run test
```

## 📂 项目结构

```text
src/
├── components/       # UI 组件与统计图表
├── hooks/            # 自定义 React Hooks
├── locales/          # 多语言翻译
├── store/            # 状态管理
├── utils/            # 统计计算与文件解析工具
└── types/            # TypeScript 类型定义
```

## 📄 开源协议

本项目采用 MIT 协议。
