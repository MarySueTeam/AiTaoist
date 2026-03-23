import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Coins, X } from 'lucide-react';
import type { ToneMode } from '../types/toneMode';

interface LiuYaoFormProps {
  onSubmit: (data: { question: string; date: string; time: string; toneMode: ToneMode; isHarshMode: boolean; method: 'time' | 'coin'; tosses?: number[] }) => void;
  isLoading: boolean;
}

export default function LiuYaoForm({ onSubmit, isLoading }: LiuYaoFormProps) {
  const [toneMode, setToneMode] = useState<ToneMode>('default');
  const [activeModal, setActiveModal] = useState<'time' | 'coin' | null>(null);
  
  const [question, setQuestion] = useState('');
  const [tosses, setTosses] = useState<number[]>([]);
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [day, setDay] = useState(String(now.getDate()));
  const [time, setTime] = useState(now.toTimeString().slice(0, 5));
  const [daysInMonth, setDaysInMonth] = useState(31);
  const isHarshMode = toneMode === 'harsh';
  const isSweetMode = toneMode === 'sweet';

  useEffect(() => {
    const days = new Date(parseInt(year), parseInt(month), 0).getDate();
    setDaysInMonth(days);
    if (parseInt(day) > days) {
      setDay(String(days));
    }
  }, [year, month]);

  const handleToss = () => {
    if (tosses.length >= 6) return;
    const coin1 = Math.random() > 0.5 ? 3 : 2;
    const coin2 = Math.random() > 0.5 ? 3 : 2;
    const coin3 = Math.random() > 0.5 ? 3 : 2;
    const sum = coin1 + coin2 + coin3;
    setTosses([...tosses, sum]);
  };

  const handleAutoToss = () => {
    if (tosses.length >= 6) return;
    const newTosses = [];
    for (let i = tosses.length; i < 6; i++) {
      const coin1 = Math.random() > 0.5 ? 3 : 2;
      const coin2 = Math.random() > 0.5 ? 3 : 2;
      const coin3 = Math.random() > 0.5 ? 3 : 2;
      newTosses.push(coin1 + coin2 + coin3);
    }
    setTosses([...tosses, ...newTosses]);
  };

  const resetTosses = () => {
    setTosses([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      alert('请填写所问之事');
      return;
    }
    if (activeModal === 'coin' && tosses.length < 6) {
      alert('请先完成6次摇卦');
      return;
    }
    const formattedMonth = month.padStart(2, '0');
    const formattedDay = day.padStart(2, '0');
    const date = `${year}-${formattedMonth}-${formattedDay}`;
    
    onSubmit({ 
      question, 
      date, 
      time, 
      toneMode,
      isHarshMode,
      method: activeModal!, 
      tosses: activeModal === 'coin' ? tosses : undefined 
    });
  };

  const openModal = (method: 'time' | 'coin') => {
    setActiveModal(method);
    resetTosses();
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-light tracking-[0.2em] mb-2 text-ink">六爻八卦</h2>
        <p className="text-sm tracking-widest text-ink/40">易有太极，是生两仪</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openModal('time')}
          className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-lg border border-white/50 flex flex-col items-center justify-center gap-4 hover:shadow-xl transition-all group"
        >
          <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center group-hover:bg-ink/10 transition-colors">
            <Clock className="w-8 h-8 text-ink/70" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold tracking-widest text-ink mb-2">时间起卦</h3>
            <p className="text-xs text-ink/50 tracking-wider">以当前或指定时间起卦，方便快捷</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => openModal('coin')}
          className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-lg border border-white/50 flex flex-col items-center justify-center gap-4 hover:shadow-xl transition-all group"
        >
          <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center group-hover:bg-ink/10 transition-colors">
            <Coins className="w-8 h-8 text-ink/70" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold tracking-widest text-ink mb-2">铜钱摇卦</h3>
            <p className="text-xs text-ink/50 tracking-wider">模拟古法掷铜钱，心诚则灵</p>
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-md backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border transition-colors duration-500 z-10 max-h-[90vh] overflow-y-auto ${
                isHarshMode ? 'bg-red-950/90 border-red-500/30' : isSweetMode ? 'bg-rose-50/92 border-rose-200/60' : 'bg-white/90 border-white/50'
              }`}
            >
              <button
                onClick={closeModal}
                className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${
                  isHarshMode ? 'text-red-200/50 hover:bg-red-900/50' : isSweetMode ? 'text-rose-700/70 hover:bg-rose-100/70' : 'text-ink/40 hover:bg-black/5'
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <h2 className={`text-2xl font-light tracking-[0.2em] mb-2 transition-colors duration-500 ${isHarshMode ? 'text-red-100' : isSweetMode ? 'text-rose-800' : 'text-ink'}`}>
                  {activeModal === 'time' ? '时间起卦' : '铜钱摇卦'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
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

                {activeModal === 'time' && (
                  <>
                    <div className="space-y-3">
                      <label className={`block text-xs font-bold uppercase tracking-widest ml-2 transition-colors duration-500 ${isHarshMode ? 'text-red-200/40' : isSweetMode ? 'text-rose-700/70' : 'text-ink/40'}`}>起卦日期 (公历)</label>
                      <div className={`flex rounded-2xl p-1 transition-colors duration-500 ${isHarshMode ? 'bg-black/30' : isSweetMode ? 'bg-rose-100/70' : 'bg-black/5'}`}>
                        <select
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className={`flex-1 bg-transparent py-3 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${isHarshMode ? 'text-red-100 hover:bg-white/5' : isSweetMode ? 'text-rose-800 hover:bg-white/50' : 'text-ink hover:bg-black/5'}`}
                        >
                          {years.map(y => <option key={y} value={y} className="text-ink">{y}年</option>)}
                        </select>
                        <div className={`w-[1px] my-2 transition-colors duration-500 ${isHarshMode ? 'bg-white/10' : isSweetMode ? 'bg-rose-200/70' : 'bg-black/10'}`}></div>
                        <select
                          value={month}
                          onChange={(e) => setMonth(e.target.value)}
                          className={`flex-1 bg-transparent py-3 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${isHarshMode ? 'text-red-100 hover:bg-white/5' : isSweetMode ? 'text-rose-800 hover:bg-white/50' : 'text-ink hover:bg-black/5'}`}
                        >
                          {months.map(m => <option key={m} value={m} className="text-ink">{m}月</option>)}
                        </select>
                        <div className={`w-[1px] my-2 transition-colors duration-500 ${isHarshMode ? 'bg-white/10' : isSweetMode ? 'bg-rose-200/70' : 'bg-black/10'}`}></div>
                        <select
                          value={day}
                          onChange={(e) => setDay(e.target.value)}
                          className={`flex-1 bg-transparent py-3 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${isHarshMode ? 'text-red-100 hover:bg-white/5' : isSweetMode ? 'text-rose-800 hover:bg-white/50' : 'text-ink hover:bg-black/5'}`}
                        >
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                            <option key={d} value={d} className="text-ink">{d}日</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className={`block text-xs font-bold uppercase tracking-widest ml-2 transition-colors duration-500 ${isHarshMode ? 'text-red-200/40' : isSweetMode ? 'text-rose-700/70' : 'text-ink/40'}`}>起卦时间</label>
                      <div className={`rounded-2xl p-1 transition-colors duration-500 ${isHarshMode ? 'bg-black/30' : isSweetMode ? 'bg-rose-100/70' : 'bg-black/5'}`}>
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          required
                          className={`w-full bg-transparent py-3 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${isHarshMode ? 'text-red-100 hover:bg-white/5' : isSweetMode ? 'text-rose-800 hover:bg-white/50' : 'text-ink hover:bg-black/5'}`}
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeModal === 'coin' && (
                  <div className={`space-y-4 p-4 rounded-2xl border transition-colors duration-500 ${isHarshMode ? 'border-red-500/20 bg-red-950/30' : isSweetMode ? 'border-rose-200/70 bg-rose-50/80' : 'border-black/5 bg-black/5'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-bold tracking-widest ${isHarshMode ? 'text-red-200/70' : isSweetMode ? 'text-rose-700/80' : 'text-ink/70'}`}>
                        摇卦进度 ({tosses.length}/6)
                      </span>
                      {tosses.length > 0 && tosses.length < 6 && (
                        <button type="button" onClick={resetTosses} className="text-xs underline opacity-60 hover:opacity-100">重新摇卦</button>
                      )}
                    </div>
                    
                    <div className="flex flex-col-reverse gap-2 mb-4">
                      {[...Array(6)].map((_, idx) => {
                        const tossVal = tosses[idx];
                        let label = "未摇";
                        let isYang = false;
                        let isChanging = false;
                        if (tossVal === 6) { label = "老阴"; isYang = false; isChanging = true; }
                        if (tossVal === 7) { label = "少阳"; isYang = true; isChanging = false; }
                        if (tossVal === 8) { label = "少阴"; isYang = false; isChanging = false; }
                        if (tossVal === 9) { label = "老阳"; isYang = true; isChanging = true; }

                        return (
                          <div key={idx} className={`flex justify-between items-center p-2 rounded-lg text-sm font-mono ${
                            tossVal 
                              ? (isHarshMode ? 'bg-red-900/40 text-red-100' : isSweetMode ? 'bg-rose-50 text-rose-700' : 'bg-white/60 text-ink') 
                              : (isHarshMode ? 'bg-black/20 text-red-200/30' : isSweetMode ? 'bg-rose-50/70 text-rose-400/50' : 'bg-black/5 text-ink/30')
                          }`}>
                            <span>{idx === 0 ? '初爻' : idx === 1 ? '二爻' : idx === 2 ? '三爻' : idx === 3 ? '四爻' : idx === 4 ? '五爻' : '上爻'}</span>
                            
                            <div className="flex items-center gap-4">
                              {tossVal ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs opacity-60 w-8 text-right">{label}</span>
                                  <div className="w-12 h-2 flex gap-1">
                                    {isYang ? (
                                      <div className={`w-full h-full rounded-sm ${isHarshMode ? 'bg-red-400' : isSweetMode ? 'bg-rose-300' : 'bg-ink'}`} />
                                    ) : (
                                      <>
                                        <div className={`w-full h-full rounded-sm ${isHarshMode ? 'bg-red-400' : isSweetMode ? 'bg-rose-300' : 'bg-ink'}`} />
                                        <div className={`w-full h-full rounded-sm ${isHarshMode ? 'bg-red-400' : isSweetMode ? 'bg-rose-300' : 'bg-ink'}`} />
                                      </>
                                    )}
                                  </div>
                                  <span className="text-xs font-bold w-4 text-center">{isChanging ? (isYang ? '○' : '×') : ''}</span>
                                </div>
                              ) : (
                                <span className="font-bold tracking-widest">{label}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {tosses.length < 6 ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleToss}
                          className={`flex-1 py-3 rounded-xl font-bold tracking-widest transition-all ${
                            isHarshMode 
                              ? 'bg-red-800/50 text-red-100 hover:bg-red-700/60 border border-red-500/30' 
                              : isSweetMode
                                ? 'bg-rose-200/80 text-rose-800 hover:bg-rose-200 border border-rose-200/80'
                              : 'bg-white text-ink hover:bg-gray-50 border border-black/10 shadow-sm'
                          }`}
                        >
                          掷铜钱 (第{tosses.length + 1}次)
                        </button>
                        <button
                          type="button"
                          onClick={handleAutoToss}
                          className={`flex-1 py-3 rounded-xl font-bold tracking-widest transition-all ${
                            isHarshMode 
                              ? 'bg-red-900/30 text-red-200 hover:bg-red-800/40 border border-red-500/20' 
                              : isSweetMode
                                ? 'bg-rose-50/90 text-rose-700 hover:bg-rose-100 border border-rose-200/70'
                              : 'bg-black/5 text-ink hover:bg-black/10 border border-transparent'
                          }`}
                        >
                          一键摇卦
                        </button>
                      </div>
                    ) : (
                      <div className={`text-center text-sm font-bold py-2 ${isHarshMode ? 'text-red-400' : isSweetMode ? 'text-rose-600' : 'text-jade'}`}>
                        摇卦完成，请点击下方排演六爻
                      </div>
                    )}
                  </div>
                )}

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
                  {isLoading ? '起卦中...' : '排演六爻'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
