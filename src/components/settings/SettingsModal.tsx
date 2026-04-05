import React, { useState } from 'react';
import { X, Save, Key, Globe, Cpu, LayoutGrid, Info, Settings } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { Button } from '../ui/Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VENDORS = [
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { id: 'minimax', name: 'MiniMax', baseUrl: 'https://api.minimaxi.com/v1', model: 'MiniMax-M2.7' },
  { id: 'siliconflow', name: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1', model: 'deepseek-ai/DeepSeek-V3' },
  { id: 'aliyun', name: '阿里云 (通义千问)', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { id: 'custom', name: '自定义 (Custom)', baseUrl: '', model: '' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { vendor, apiKey, baseUrl, model, setSettings } = useSettingsStore();
  
  const [localVendor, setLocalVendor] = useState(vendor);
  const [localKey, setLocalKey] = useState(apiKey);
  const [localBaseUrl, setLocalBaseUrl] = useState(baseUrl);
  const [localModel, setLocalModel] = useState(model);

  // 当切换厂商时，自动填充对应的 BaseUrl 和 Model
  const handleVendorChange = (vendorId: string) => {
    setLocalVendor(vendorId);
    const v = VENDORS.find(it => it.id === vendorId);
    if (v && v.id !== 'custom') {
      setLocalBaseUrl(v.baseUrl);
      setLocalModel(v.model);
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    setSettings({
      vendor: localVendor,
      apiKey: localKey,
      baseUrl: localBaseUrl,
      model: localModel,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1C1C1F] border border-white/10 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-linear-brand/20 flex items-center justify-center">
              <Settings size={14} className="text-linear-brandAccent" />
            </div>
            <h2 className="text-[15px] font-linear-semibold text-white tracking-tight">AI 模型配置 (Providers)</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-linear-quaternary hover:text-white transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 厂商选择 */}
          <div className="space-y-2">
            <label className="text-[12px] font-linear-medium text-linear-secondary flex items-center gap-1.5">
              <LayoutGrid size={14} className="text-linear-brandAccent" />
              厂家预设 (Select Provider)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {VENDORS.map(v => (
                <button
                  key={v.id}
                  onClick={() => handleVendorChange(v.id)}
                  className={`px-2 py-2 rounded-md text-[11px] font-linear-medium border transition-all text-center ${
                    localVendor === v.id 
                      ? 'bg-linear-brandAccent/10 border-linear-brandAccent text-linear-brandAccent shadow-[0_0_10px_rgba(var(--brand-accent-rgb),0.1)]' 
                      : 'bg-white/5 border-white/10 text-linear-secondary hover:bg-white/10'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-linear-medium text-linear-secondary flex items-center gap-1.5">
                <Globe size={14} className="text-linear-brandAccent" />
                API Base URL
              </label>
              <input 
                type="text" 
                value={localBaseUrl}
                onChange={(e) => setLocalBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[13px] text-linear-primary focus:outline-none focus:border-linear-brandAccent/50 focus:ring-1 focus:ring-linear-brandAccent/50 transition-all font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] font-linear-medium text-linear-secondary flex items-center gap-1.5">
                  <Cpu size={14} className="text-linear-brandAccent" />
                  模型 (Model)
                </label>
                <input 
                  type="text" 
                  value={localModel}
                  onChange={(e) => setLocalModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[13px] text-linear-primary focus:outline-none focus:border-linear-brandAccent/50 focus:ring-1 focus:ring-linear-brandAccent/50 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] font-linear-medium text-linear-secondary flex items-center gap-1.5">
                  <Key size={14} className="text-linear-brandAccent" />
                  API Key
                </label>
                <input 
                  type="password" 
                  value={localKey}
                  onChange={(e) => setLocalKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-[13px] text-linear-primary focus:outline-none focus:border-linear-brandAccent/50 focus:ring-1 focus:ring-linear-brandAccent/50 transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-linear-brandAccent/5 border border-linear-brandAccent/20 rounded-lg flex items-start gap-3">
            <Info size={14} className="text-linear-brandAccent mt-0.5 shrink-0" />
            <p className="text-[11px] text-linear-secondary leading-normal">
              参考 <span className="text-linear-brandAccent italic">cc-switch</span> 项目配置，已同步主流厂商的最新模型。建议国内用户优先使用 <span className="text-linear-brandAccent">SiliconFlow</span> 或 <span className="text-linear-brandAccent">DeepSeek</span> 以获得更佳体验。
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 bg-white/5 border-t border-white/5">
          <Button variant="ghost" onClick={onClose} className="px-4">取消</Button>
          <Button variant="primary" onClick={handleSave} className="flex items-center gap-1.5 px-4 h-9">
            <Save size={14} />
            保存配置
          </Button>
        </div>
      </div>
    </div>
  );
};
