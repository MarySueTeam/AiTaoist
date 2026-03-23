import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyFortuneResult, calculateDailyFortune } from '../services/fortuneService';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface FortuneCalendarProps {
  birthInfo: { gender: string; birthDate: string; birthTime: string } | null;
  onRequireBirthInfo: () => void;
}

export default function FortuneCalendar({ birthInfo, onRequireBirthInfo }: FortuneCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dailyFortune, setDailyFortune] = useState<DailyFortuneResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1 }, (_, i) => i);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = async (day: number) => {
    if (!birthInfo) {
      onRequireBirthInfo();
      return;
    }

    const targetDate = new Date(year, month, day);
    setSelectedDate(targetDate);
    
    // Format date as YYYY-MM-DD
    const targetDateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await calculateDailyFortune(
        birthInfo.gender,
        birthInfo.birthDate,
        birthInfo.birthTime,
        targetDateStr
      );
      setDailyFortune(result);
    } catch (err: any) {
      setError(err.message || '获取运势失败');
    } finally {
      setIsLoading(false);
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
  };

  if (!birthInfo) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white/60 backdrop-blur-md p-8 rounded-2xl shadow-sm border border-[#d5d0c4] text-center">
        <CalendarIcon className="w-12 h-12 text-ink/40 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-ink mb-2">需要命主信息</h3>
        <p className="text-ink/60 mb-6">请先在“八字排盘”中输入您的出生信息，以便为您推算每日运势。</p>
        <button
          onClick={onRequireBirthInfo}
          className="px-6 py-2 bg-ink text-paper rounded-xl hover:bg-ink/90 transition-all font-bold tracking-widest"
        >
          去填写信息
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Calendar View */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-[#d5d0c4]"
      >
        <div className="flex justify-between items-center mb-6">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-ink" />
          </button>
          <h2 className="text-xl font-bold text-ink tracking-widest">
            {year}年 {month + 1}月
          </h2>
          <button onClick={handleNextMonth} className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 text-ink" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-sm font-medium text-ink/60">
          {['一', '二', '三', '四', '五', '六', '日'].map(d => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {blanks.map(b => (
            <div key={`blank-${b}`} className="aspect-square"></div>
          ))}
          {days.map(d => (
            <button
              key={d}
              onClick={() => handleDateClick(d)}
              className={`aspect-square flex items-center justify-center rounded-xl text-sm transition-all
                ${isSelected(d) ? 'bg-gold text-white font-bold shadow-md' : 
                  isToday(d) ? 'border-2 border-gold text-gold font-bold' : 
                  'hover:bg-black/5 text-ink'}
              `}
            >
              {d}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Daily Fortune View */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white/60 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-[#d5d0c4] flex flex-col"
      >
        <h3 className="text-lg font-bold text-ink tracking-widest mb-6 border-b border-ink/10 pb-4">
          {selectedDate ? `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 运势` : '请选择日期查看运势'}
        </h3>

        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-ink/60 py-12">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-gold" />
                <p className="tracking-widest text-sm">道长正在为您推演当日吉凶...</p>
              </motion.div>
            ) : error ? (
              <motion.div key="error" className="text-center text-red-500 py-12">
                {error}
              </motion.div>
            ) : dailyFortune ? (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-center justify-between bg-gold/10 p-4 rounded-xl">
                  <span className="font-bold text-ink">运势评分</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-black/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gold rounded-full transition-all duration-1000"
                        style={{ width: `${dailyFortune.score}%` }}
                      ></div>
                    </div>
                    <span className="text-gold font-bold">{dailyFortune.score}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-ink/60 mb-2">运势简报</h4>
                  <p className="text-ink leading-relaxed font-sans bg-white/50 p-4 rounded-xl">
                    {dailyFortune.summary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50/50 border border-green-200 p-4 rounded-xl">
                    <div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold mb-2">宜</div>
                    <p className="text-sm text-green-800 font-sans">{dailyFortune.auspicious}</p>
                  </div>
                  <div className="bg-red-50/50 border border-red-200 p-4 rounded-xl">
                    <div className="w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold mb-2">忌</div>
                    <p className="text-sm text-red-800 font-sans">{dailyFortune.inauspicious}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" className="text-center text-ink/40 py-12">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>点击左侧日历，查看每日运势</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
