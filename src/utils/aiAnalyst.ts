import { DescriptiveResult } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';

export interface AIInsight {
  type: 'normality' | 'stability' | 'outliers' | 'summary' | 'trend' | 'correlation';
  status: 'good' | 'warning' | 'alert';
  title: string;
  content: string;
}

const SYSTEM_PROMPT = `
你是一个资深的质量工程统计分析师（类似于 Minitab 专家）。请根据提供的数据统计摘要（均值、标准差、偏度、峰度、异常值等），给出严谨的质量诊断报告。

你的任务是：
1. 评估正态性：通过偏度和峰度判断数据是否符合正态分布。
2. 稳定性分析：判断过程是否受控，是否存在明显的离群点威胁。
3. 改进建议：给出针对性的工程改进建议。

返回的 JSON 必须是一个数组，不要包含 markdown 代码块如 \`\`\`json，直接返回数组本身。
数组元素结构如下：
{
  "type": "normality" | "stability" | "outliers" | "summary" | "trend" | "correlation",
  "status": "good" | "warning" | "alert",
  "title": "诊断项标题",
  "content": "具体的统计结论和工程建议（专业、精炼，不超过 30 字）"
}
`;

/**
 * Real LLM-based AI Analyst.
 */
export const analyzeDatasetAI = async (stats: DescriptiveResult, outliersCount: number): Promise<AIInsight[]> => {
  const { apiKey, baseUrl, model } = useSettingsStore.getState();

  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  const prompt = `以下是当前数据集的描述性统计结果：
- 样本量 (Count): ${stats.n}
- 均值 (Mean): ${stats.mean.toFixed(4)}
- 中位数 (Median): ${stats.median.toFixed(4)}
- 标准差 (Stdev): ${stats.stdev.toFixed(4)}
- 最小值 (Min): ${stats.min.toFixed(4)}
- 最大值 (Max): ${stats.max.toFixed(4)}
- 偏度 (Skewness): ${stats.skewness.toFixed(4)}
- 峰度 (Kurtosis): ${stats.kurtosis.toFixed(4)}
- 异常值数量: ${outliersCount}

请根据以上数据进行分析并按要求返回 JSON 数组。`;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API 请求失败: ${response.status} ${response.statusText} ${errorData.error?.message || ''}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // 1. 移除 <think>...</think> 标签及其内容
    const cleanedContent = content.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    const jsonMatch = cleanedContent.match(/\[\s*\{[\s\S]*?\}\s*\]/);

    if (!jsonMatch) {
      console.error('Failed to find JSON array in content:', cleanedContent);
      throw new Error('AI 返回的格式不正确，无法解析分析报告。');
    }

    const parsed: unknown = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      throw new Error('AI 返回的不是数组结构。');
    }

    const validTypes = ['normality', 'stability', 'outliers', 'summary', 'trend', 'correlation'];
    const validStatus = ['good', 'warning', 'alert'];
    const insights: AIInsight[] = parsed
      .filter((item): item is AIInsight => {
        if (!item || typeof item !== 'object') return false;
        const o = item as Record<string, unknown>;
        return (
          typeof o.type === 'string' && validTypes.includes(o.type) &&
          typeof o.status === 'string' && validStatus.includes(o.status) &&
          typeof o.title === 'string' &&
          typeof o.content === 'string'
        );
      });

    if (insights.length === 0) {
      throw new Error('AI 返回的条目均不符合预期结构。');
    }
    return insights;
  } catch (err: unknown) {
    console.error('AI Analysis Error:', err);
    throw err;
  }
};
