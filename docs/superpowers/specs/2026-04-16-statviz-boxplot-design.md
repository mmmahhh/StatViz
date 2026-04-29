# StatViz 箱线图模块设计文档

**日期**: 2026-04-16
**状态**: Draft
**范围**: 一期 — 箱线图功能

---

## 1. 背景与目标

### 问题
产品质量分析中，需要对不同批次、不同坩埚的检测数据进行可视化对比。当前缺乏专用工具，依赖 Minitab 手动操作，效率低且无法标准化。

### 目标
构建 Electron 桌面客户端，提供三种箱线图对比模式，支持 CSV/Excel 数据导入和 SVG/PNG/PDF 导出，替代 Minitab 的箱线图分析流程。

### 范围
- **一期（本文档）**: 箱线图三种对比模式 + 数据导入导出
- **二期（后续）**: MSA（Kappa 分析、线性与偏移分析）

---

## 2. 技术选型

| 层次 | 技术 | 用途 |
|------|------|------|
| 桌面壳 | Electron | 跨平台桌面应用 |
| 前端框架 | React + TypeScript | UI 组件化 |
| 图表库 | D3.js | 自定义箱线图绑制 |
| 构建工具 | Vite | 快速开发构建 |
| CSS | Tailwind CSS | 快速样式开发 |
| CSV 解析 | Papa Parse | CSV 文件解析 |
| Excel 解析 | SheetJS (xlsx) | Excel 文件解析 |
| PDF 导出 | jsPDF + html2canvas | PDF 报告生成 |

---

## 3. 数据模型

### 3.1 输入数据格式

CSV/Excel 文件，固定四列：

| 列名 | 类型 | 说明 | 示例 |
|------|------|------|------|
| 规格 | string | 产品规格 | 36寸 |
| 生产批次 | string | 生产批次号 | 0402 |
| 坩埚编码 | string | 坩埚唯一标识 | CG0402-001 |
| 检测值 | number | 检测数值 | 98.4 |

### 3.2 核心类型定义

```typescript
interface DataRow {
  spec: string;        // 规格
  batch: string;       // 生产批次
  crucible: string;    // 坩埚编码
  value: number;       // 检测值
}

interface BoxPlotStats {
  group: string;       // 分组名称
  n: number;           // 样本数
  min: number;         // 最小值
  q1: number;          // 第一四分位数
  median: number;      // 中位数
  q3: number;          // 第三四分位数
  max: number;         // 最大值
  mean: number;        // 均值
  iqr: number;         // 四分位距
  lowerWhisker: number; // 下须线端点
  upperWhisker: number; // 上须线端点
  outliers: number[];   // 异常点
}

type CompareMode = 'batch' | 'custom-group' | 'single-vs-range';

interface CompareConfig {
  mode: CompareMode;
  spec: string;        // 当前选中的规格
  groups: GroupDef[];   // 分组定义
}

interface GroupDef {
  name: string;        // 分组名称（如 "0402"、"优"、"基线"）
  filter: DataFilter;  // 数据筛选条件
}

type DataFilter =
  | { type: 'batches'; batches: string[] }        // 按批次筛选
  | { type: 'crucibles'; crucibles: string[] }    // 按坩埚筛选
  | { type: 'batchRange'; from: string; to: string }; // 按批次范围
```

---

## 4. 三种对比模式

### 4.1 批次对比

**场景**: 同规格不同批次间的质量对比（如 0402 vs 0403）

**操作流程**:
1. 导入数据 → 自动识别所有规格和批次
2. 用户选择规格（如 36 寸）
3. 勾选要对比的批次（多选）
4. 每个批次生成一个箱体，并排展示

### 4.2 优裂对比（自定义分组）

**场景**: 按坩埚质量等级分组对比

**操作流程**:
1. 导入数据 → 列出所有坩埚编码
2. 用户创建分组（如"组A: 优"、"组B: 裂"）
3. 将坩埚拖选/勾选到各组中
4. 支持创建 2+ 个组，用户可自定义组名
5. 每组聚合所有坩埚的检测值，生成一个箱体

### 4.3 单批次 vs 大批次

**场景**: 单一批次与历史批次区间的对比（如 0402 vs 0320~0330）

**操作流程**:
1. 导入数据
2. 用户选择「焦点批次」（单选，如 0402）
3. 用户选择「基线批次范围」（如 0320 到 0330）
4. 基线范围内所有批次数据合并为一组
5. 生成两个箱体：焦点 vs 基线

---

## 5. 箱线图绘制规则

遵循标准 Tukey 箱线图规范：

| 元素 | 规则 |
|------|------|
| 箱体 | Q1（25%）到 Q3（75%） |
| 中位数线 | Q2（50%），加粗显示，旁标数值 |
| 须线 | 延伸到 1.5×IQR 范围内的最远数据点 |
| 异常点 | 超出须线的数据点，用圆点标记 |
| 均值标记 | 可选，菱形或十字标记 |

### 交互行为
- 鼠标悬停箱体：显示 tooltip 包含完整统计值
- 异常点可点击：显示对应坩埚编码和检测值
- 图表支持缩放（数据量大时）

---

## 6. 界面布局

```
┌──────────────────────────────────────────────────┐
│  StatViz                              ─  □  ✕   │
├──────────────────────────────────────────────────┤
│  [导入数据]  模式: ○批次对比 ○优裂对比 ○单vs大   │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│  数据面板 │         箱线图区域                     │
│  --------│    ┌─┐                                │
│  规格筛选 │    │ │  ┌─┐                           │
│  批次列表 │  ──┤ ├──┤ ├──                         │
│  坩埚列表 │    │ │  │ │                           │
│          │    └─┘  └─┘                           │
│  [分组操作]│   0402  0403                         │
│          │                                       │
│          ├───────────────────────────────────────┤
│          │  统计摘要表格                          │
│          │  分组 | N | 均值 | 中位数 | Q1 | Q3   │
│          ├───────────────────────────────────────┤
│          │  [当前分组 ▼ | 全部数据]  原始数据表格  │
│          │  规格 | 生产批次 | 坩埚编码 | 检测值   │
│          │  36寸 | 0402   | CG0402-001 | 98.4   │
│          │  ...  (可滚动)                        │
├──────────┴───────────────────────────────────────┤
│  [导出 SVG] [导出 PNG] [导出 PDF报告]             │
└──────────────────────────────────────────────────┘
```

### 区域说明

| 区域 | 说明 |
|------|------|
| 顶部栏 | 数据导入按钮 + 对比模式切换 |
| 左侧面板 | 数据筛选（规格、批次、坩埚列表）+ 分组操作区 |
| 右上：图表区 | D3 箱线图实时渲染 |
| 右中：统计摘要 | 各分组的统计指标表格 |
| 右下：数据表格 | 原始导入数据，支持「当前分组/全部数据」切换，可滚动 |
| 底部栏 | SVG/PNG/PDF 导出按钮 |

---

## 7. 导出功能

### 7.1 SVG/PNG 导出
- 导出当前箱线图为矢量（SVG）或位图（PNG）
- 包含图表标题、坐标轴标签、图例

### 7.2 PDF 报告
报告内容：
1. **标题页**: 规格、对比模式、生成日期
2. **箱线图**: SVG 渲染嵌入
3. **统计摘要表**: 各分组完整统计指标
4. **原始数据表**: 参与对比的数据行
5. **页脚**: 数据来源文件名、数据行数

---

## 8. 项目结构

```
StatViz/
├── electron/
│   ├── main.ts              # Electron 主进程
│   └── preload.ts           # IPC 桥接
├── src/
│   ├── App.tsx              # 根组件 + 路由
│   ├── pages/
│   │   └── BoxPlot/
│   │       ├── BoxPlotPage.tsx       # 页面容器
│   │       ├── DataImporter.tsx      # 拖拽导入组件
│   │       ├── SidePanel.tsx         # 左侧筛选/分组面板
│   │       ├── GroupSelector.tsx     # 分组选择器
│   │       ├── BoxPlotChart.tsx      # D3 箱线图核心
│   │       ├── StatsTable.tsx        # 统计摘要表
│   │       ├── DataTable.tsx         # 原始数据表格
│   │       └── ExportPanel.tsx       # 导出按钮组
│   ├── lib/
│   │   ├── csv-parser.ts    # Papa Parse 封装
│   │   ├── excel-parser.ts  # SheetJS 封装
│   │   ├── stats.ts         # 统计计算（Q1/Q2/Q3/IQR/须线/异常点）
│   │   └── pdf-report.ts   # jsPDF 报告生成
│   ├── types/
│   │   └── data.ts          # 类型定义
│   └── styles/
│       └── index.css        # Tailwind 入口
├── test_data/               # 测试数据
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 9. 统计计算规则

`stats.ts` 中的 `computeBoxPlotStats(values: number[]): BoxPlotStats`：

1. 排序数组
2. Q1 = 第 25 百分位数（线性插值法）
3. Q2 (median) = 第 50 百分位数
4. Q3 = 第 75 百分位数
5. IQR = Q3 - Q1
6. lowerWhisker = max(min, Q1 - 1.5 * IQR) 范围内的最小实际数据点
7. upperWhisker = min(max, Q3 + 1.5 * IQR) 范围内的最大实际数据点
8. outliers = 所有 < lowerWhisker 或 > upperWhisker 的数据点
9. mean = 算术平均值

---

## 10. 二期预留：MSA 模块

以下功能不在一期范围内，但架构设计需考虑扩展：

- **Kappa 一致性分析**: 多检验员判定结果的一致性评估
- **线性与偏移分析**: 基准值 vs 实测值的线性回归和偏移计算
- **取数区间**: 用户指定数据范围后自动生成分析报告

预留 `src/pages/MSA/` 目录，页面结构与 BoxPlot 模块平行。
