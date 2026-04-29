# StatViz 架构解耦与功能加固方案 v1.0

**负责人**: 助理 (claude-方案设计)  
**创建日期**: 2026-04-20  
**状态**: 待评审 [PLAN REVIEW REQUEST]

---

## 1. 背景与审计结论

基于成员对 `systems/StatViz` 的代码审计（Task 01）及 Lint 治理成果，当前系统存在以下架构痛点：
1. **主组件臃肿**：`App.tsx` 耦合了复杂的 `exportAsPDF` 导出逻辑（约 50 行），涉及 `jsPDF` 分页与 `html2canvas` 渲染，不利于维护。
2. **Hook 逻辑分散**：`compareBoxPlotData` 与主分析逻辑在 `useAnalysis.ts` 中混合，缺乏统一的元数据处理标准。
3. **性能风险**：Y 轴频繁切换时，对比数据集的计算逻辑依赖项过广，可能导致界面瞬时卡顿。

---

## 2. 优化目标

1. **架构解耦**：将 PDF 导出逻辑从 UI 层彻底剥离。
2. **逻辑标准化**：统一所有分析模块（Basic, Capability, MSA）的元数据上报格式。
3. **性能加固**：优化 `compareBoxPlotData` 缓存策略。

---

## 3. 详细设计逻辑

### 3.1 PDF 导出工具化 (Task 03.1)
- **新建文件**：`src/utils/pdfGenerator.ts`
- **功能内容**：封装 `exportAsPDF(elementId: string, options: PDFOptions)`。
- **技术要点**：
    - 使用 `html2canvas` 捕获报告区域。
    - 实现 A4 纵向分页逻辑（计算 imgHeight 与 pdfPageHeight）。
    - 统一错误处理，通过 Promise 返回导出状态。

### 3.2 核心 Hook 逻辑精简 (Task 03.2)
- **修改文件**：`src/hooks/useAnalysis.ts`
- **优化点**：
    - 将 `compareBoxPlotData` 的计算逻辑进一步封装为私有函数。
    - 细化 `useMemo` 的依赖项，确保仅在 `activeDataset` 核心数据变化时重算对比。
    - 引入 `AnalysisMetadata` 标准接口，确保所有分析面板在 `ReportSummaryPanel` 中表现一致。

---

## 4. 任务拆解 (指派给 Gemini)

| 任务编号 | 说明 | 验收标准 |
|---------|------|---------|
| **03.1** | 抽离 PDF 导出逻辑至 `src/utils/pdfGenerator.ts` | `App.tsx` 减少 40+ 行代码，PDF 导出功能正常且支持分页 |
| **03.2** | 优化 `useAnalysis.ts` 中的 `compareBoxPlotData` 依赖 | `npm test` 通过，手动切换 Y 轴时对比逻辑无冗余触发 |
| **03.3** | 统一分析模块元数据 | 全量 Lint 0 错误，元数据字段在报告页正确显示 |

---

## 5. 验收标准

- **代码质量**：Lint 0 错误，保持 `max-warnings 0`。
- **稳定性**：58 项单元测试 100% 通过。
- **功能一致性**：PDF 导出报告需包含 100% 数据细节，分页无截断。

---

*方案发布人：助理 (01KPK49YY807F9EDFMQTPEKB1S)*  
*最后更新：2026-04-20*
