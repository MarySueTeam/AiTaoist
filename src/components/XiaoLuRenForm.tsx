import React, { useState } from 'react';
import { motion } from 'motion/react';
import type { ToneMode } from '../types/toneMode';

interface XiaoLuRenFormProps {
  onSubmit: (data: { question: string; date: string; time: string; toneMode: ToneMode; isHarshMode: boolean }) => void;
  isLoading: boolean;
}

export default function XiaoLuRenForm({ onSubmit, isLoading }: XiaoLuRenFormProps) {
  const [question, setQuestion] = useState('');
  const [toneMode, setToneMode] = useState<ToneMode>('default');
  
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [time, setTime] = useState(now.toTimeString().slice(0, 5));
  const isHarshMode = toneMode === 'harsh';
  const isSweetMode = toneMode === 'sweet';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      alert('请填写所问之事');
      return;
    }
    onSubmit({ question, date, time, toneMode, isHarshMode });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-md mx-auto backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border transition-colors duration-500 ${
        isHarshMode ? 'bg-red-950/90 border-red-500/30' : isSweetMode ? 'bg-rose-50/92 border-rose-200/60' : 'bg-white/80 border-white/50'
      }`}
    >
      <div className="text-center mb-10">
        <h2 className={`text-3xl font-light tracking-[0.2em] mb-2 transition-colors duration-500 ${isHarshMode ? 'text-red-100' : isSweetMode ? 'text-rose-800' : 'text-ink'}`}>小六壬</h2>
        <p className={`text-sm tracking-widest transition-colors duration-500 ${isHarshMode ? 'text-red-200/60' : isSweetMode ? 'text-rose-600/70' : 'text-ink/40'}`}>掐指一算，便知吉凶</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <label className={`block text-xs font-bold uppercase tracking-widest ml-2 transition-colors duration-500 ${isHarshMode ? 'text-red-200/40' : isSweetMode ? 'text-rose-700/70' : 'text-ink/40'}`}>
            所问之事
          </label>
          <div className={`rounded-2xl p-1 transition-colors duration-500 ${isHarshMode ? 'bg-black/30' : isSweetMode ? 'bg-rose-100/70' : 'bg-black/5'}`}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              rows={3}
              className={`w-full bg-transparent px-4 py-3 appearance-none outline-none font-medium rounded-xl transition-colors resize-none ${
                isHarshMode ? 'text-red-100 placeholder-red-200/30' : isSweetMode ? 'text-rose-800 placeholder-rose-500/50' : 'text-ink placeholder-ink/30'
              }`}
              placeholder="例如：问近期财运如何？或 问某项合作能否成功？"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className={`block text-xs font-bold uppercase tracking-widest ml-2 transition-colors duration-500 ${isHarshMode ? 'text-red-200/40' : isSweetMode ? 'text-rose-700/70' : 'text-ink/40'}`}>
              起卦日期
            </label>
            <div className={`rounded-2xl p-1 transition-colors duration-500 ${isHarshMode ? 'bg-black/30' : isSweetMode ? 'bg-rose-100/70' : 'bg-black/5'}`}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className={`w-full bg-transparent px-4 py-3 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${
                  isHarshMode ? 'text-red-100 hover:bg-white/5' : isSweetMode ? 'text-rose-800 hover:bg-white/50' : 'text-ink hover:bg-black/5'
                }`}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className={`block text-xs font-bold uppercase tracking-widest ml-2 transition-colors duration-500 ${isHarshMode ? 'text-red-200/40' : isSweetMode ? 'text-rose-700/70' : 'text-ink/40'}`}>
              起卦时间
            </label>
            <div className={`rounded-2xl p-1 transition-colors duration-500 ${isHarshMode ? 'bg-black/30' : isSweetMode ? 'bg-rose-100/70' : 'bg-black/5'}`}>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className={`w-full bg-transparent px-4 py-3 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${
                  isHarshMode ? 'text-red-100 hover:bg-white/5' : isSweetMode ? 'text-rose-800 hover:bg-white/50' : 'text-ink hover:bg-black/5'
                }`}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 px-2 pt-2">
          <div className={`text-sm font-bold tracking-widest transition-colors duration-500 ${isHarshMode ? 'text-red-200' : isSweetMode ? 'text-rose-700' : 'text-ink/60'}`}>语气模式</div>
          <div className={`p-1.5 rounded-2xl grid grid-cols-3 gap-1 transition-colors duration-500 ${isHarshMode ? 'bg-black/30' : isSweetMode ? 'bg-rose-100/70' : 'bg-black/5'}`}>
            {[
              { id: 'default', label: '默认模式' },
              { id: 'harsh', label: '毒舌模式' },
              { id: 'sweet', label: '甜嘴模式' },
            ].map((option) => {
              const active = toneMode === option.id;
              const sweetActive = option.id === 'sweet' && active;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setToneMode(option.id as ToneMode)}
                  className={`rounded-xl px-3 py-2 text-sm font-bold tracking-wide transition-colors ${
                    active
                      ? sweetActive
                        ? 'bg-rose-100 text-rose-700'
                        : isHarshMode
                          ? 'bg-red-500 text-red-950'
                          : 'bg-white text-ink'
                      : isHarshMode
                        ? 'text-red-200/50 hover:text-red-200'
                        : isSweetMode
                          ? 'text-rose-500/70 hover:text-rose-700'
                        : 'text-ink/50 hover:text-ink'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-2xl font-bold text-lg tracking-[0.2em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl mt-4 ${
            isHarshMode 
              ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/50' 
              : isSweetMode
                ? 'bg-rose-300 text-rose-800 hover:bg-rose-200 shadow-rose-200/50'
              : 'bg-ink text-paper hover:bg-ink/90 shadow-ink/10'
          }`}
        >
          {isLoading ? '起卦中...' : '排演小六壬'}
        </button>
      </form>
    </motion.div>
  );
}
