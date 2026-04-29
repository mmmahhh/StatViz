# StatViz 架构精简与逻辑补强方案 v1.1

**负责人**: 助理 (claude-方案设计)  
**创建日期**: 2026-04-20  
**状态**: 内部修订 [DRAFT]

---

## 1. 修订背景 (基于 Codex 审计反馈)

由于 v1.0 版本对代码基准存在误判，v1.1 版本已对齐当前 `StatViz` 现状：
1. **承认工具化已完成**：`pdfGenerator.ts` 与 `AnalysisMetadata` 均已在线，逻辑已部分抽离。
2. **对齐产品约束**：维持现有的 500 行虚拟滚动导出限制，不再追求“100% 导出”以避免性能崩溃。
3. **识别真实痛点**：当前 `App.tsx` 仍残留着 500ms 硬编码等待、文件名正则过滤等导出编排逻辑，且 Hook 层的集成测试覆盖率仍处于 15% 的低位。

---

## 2. 优化目标

1. **导出编排精简**：清理 `App.tsx` 中残留的 PDF 编排副作用。
2. **Hook 逻辑加固**：收窄 `compareBoxPlotData` 的依赖范围，防止缓存穿透。
3. **集成测试补强**：针对审计发现的 GAP-01（跨 X 轴比较）与 GAP-03（枚举验证）新增集成测试。

---

## 3. 详细修订任务 (指派给 Gemini)

### 3.1 PDF 导出逻辑深度收编 (Task 03.1)
- **修改文件**：`src/utils/pdfGenerator.ts`
- **任务内容**：
    - 将 `App.tsx` 中的文件名正则清洗逻辑 (`replace(/[^\w\u4e00-\u9fa5-]+/g, '_')`) 移入工具函数。
    - 统一导出时的 Loading 状态反馈，将 `alert` 替换为更为温和的 UI 提示（若已引入 antd 则使用 message）。
    - 移除 `App.tsx` 中的 `setTimeout`，在 `exportElementToPDF` 内部通过 `requestAnimationFrame` 或更优雅的方式确保渲染帧完成。

### 3.2 比较逻辑依赖收窄 (Task 03.2)
- **修改文件**：`src/hooks/useAnalysis.ts`
- **任务内容**：
    - 优化 `compareBoxPlotData` 的 `useMemo` 依赖项。明确仅在 `compareDataset.rawData`、`dimensions.yAxis` 及 `module` 实际变化时重算。
    - 确保 `calculateCompareData` 内部正确处理 `compareDataset` 自身的 `xAxis[0]`，修复 BUG-01。

### 3.3 补齐 Hook 集成测试 (Task 03.3)
- **修改/新建文件**：`src/hooks/useAnalysis.integration.test.ts`
- **覆盖点**：
    - 验证主数据集与比较数据集使用不同 X 轴字段时的计算正确性。
    - 验证 `canRunAnalysis` 在不同分析模块（MSA, Regression）下的切换边界。

---

## 4. 验收标准 (与现状对齐)

- **代码量**：`App.tsx` 的 `exportAsPDF` 缩减至 10 行以内纯编排逻辑。
- **稳定性**：`npm test` 累计通过用例数应 ≥ 65 个（新增 7+ 集成用例）。
- **质量标准**：Lint 0 错误，Hook 层覆盖率显著提升。

---

*方案发布人：助理 (01KPK49YY807F9EDFMQTPEKB1S)*  
*最后更新：2026-04-20*
