## [LRN-20260406-001] correction

**Logged**: 2026-04-05T16:43:44Z
**Priority**: medium
**Status**: resolved
**Area**: workflow

### Summary
Missed explicit activation of mandated Superpowers skills.

### Details
According to GEMINI.md, Superpowers skills (brainstorming, writing-plans, systematic-debugging) should be activated as a standard workflow. Although the logic was applied, the tool call 'activate_skill' was missed.

### Suggested Action
Always check GEMINI.md mandates at the start of a session and ensure explicit tool-based activation of required skills.

---

## [LRN-20260409-001] best_practice

**Logged**: 2026-04-09T13:00:00Z
**Priority**: high
**Status**: resolved
**Area**: frontend

### Summary
StatViz 项目积累了多处 TypeScript 类型错误，根因是新增功能时未同步更新类型导入和接口定义。

### Details
代码审查发现 11 处类型错误，分布在 8 个文件中：
1. **缺少导入** — `useAnalysis.ts` 使用了 `calculateKappa`/`calculateLinearityBias` 但未导入；`msaStats.ts` 使用 `KappaResult`/`LinearityBiasResult` 类型但未从 types 导入
2. **属性名不匹配** — `aiAnalyst.ts` 用 `stats.count` 但 `DescriptiveResult` 接口字段名为 `n`
3. **接口扩展后测试未更新** — `CapabilityConfig` 新增 `subgroupSize` 字段后，7 处测试数据未补全
4. **i18n 类型签名过窄** — `useTranslation` 的 `t()` 只接受顶层 key，不支持点号路径如 `"app.errorParsing"`
5. **可选链缺失** — `capabilityConfig` fallback 到 `{}` 导致属性访问失败
6. **props 解构遗漏** — `ChartView` 接口声明了 `kappaData`/`linearityData` 但解构时遗漏

### Suggested Action
在新增功能模块后，始终运行 `npx tsc --noEmit` 验证全量类型安全。考虑在 pre-commit hook 中加入类型检查。

### Resolution
- **Resolved**: 2026-04-09T13:00:00Z
- **Notes**: 修复了全部 11 处错误，`tsc --noEmit` 通过零错误

---
