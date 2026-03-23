import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Flame } from 'lucide-react';
import { Lunar, LunarYear, Solar } from 'lunar-javascript';
import type { ToneMode } from '../types/toneMode';

interface BaziFormProps {
  onSubmit: (data: { gender: string; birthDate: string; birthTime: string; toneMode: ToneMode; isHarshMode: boolean; calendarType: string; isLeapMonth: boolean }) => void;
  isLoading: boolean;
}

export default function BaziForm({ onSubmit, isLoading }: BaziFormProps) {
  const [gender, setGender] = useState('男');
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [year, setYear] = useState(String(currentYear - 30));
  const [month, setMonth] = useState('1');
  const [day, setDay] = useState('1');
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [leapMonthInYear, setLeapMonthInYear] = useState(0);

  const [birthTime, setBirthTime] = useState('12:00');
  const [toneMode, setToneMode] = useState<ToneMode>('default');

  const [daysInMonth, setDaysInMonth] = useState(31);
  const [correspondingDate, setCorrespondingDate] = useState('');
  const isHarshMode = toneMode === 'harsh';
  const isSweetMode = toneMode === 'sweet';

  const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
  const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

  const handleCalendarChange = (type: 'solar' | 'lunar') => {
    if (type === calendarType) return;
    
    if (type === 'lunar') {
      const solar = Solar.fromYmd(parseInt(year), parseInt(month), parseInt(day));
      const lunar = solar.getLunar();
      setYear(String(lunar.getYear()));
      setMonth(String(Math.abs(lunar.getMonth())));
      setDay(String(lunar.getDay()));
      if (lunar.getMonth() < 0) {
        setIsLeapMonth(true);
      } else {
        setIsLeapMonth(false);
      }
    } else {
      const m = isLeapMonth && leapMonthInYear === parseInt(month) ? -parseInt(month) : parseInt(month);
      const lunar = Lunar.fromYmd(parseInt(year), m, parseInt(day));
      const solar = lunar.getSolar();
      setYear(String(solar.getYear()));
      setMonth(String(solar.getMonth()));
      setDay(String(solar.getDay()));
      setIsLeapMonth(false);
    }
    setCalendarType(type);
  };

  useEffect(() => {
    try {
      if (calendarType === 'lunar') {
        const m = isLeapMonth && leapMonthInYear === parseInt(month) ? -parseInt(month) : parseInt(month);
        const lunar = Lunar.fromYmd(parseInt(year), m, parseInt(day));
        const solar = lunar.getSolar();
        setCorrespondingDate(`对应公历：${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`);
      } else {
        const solar = Solar.fromYmd(parseInt(year), parseInt(month), parseInt(day));
        const lunar = solar.getLunar();
        const leapStr = lunar.getMonth() < 0 ? '闰' : '';
        setCorrespondingDate(`对应农历：${lunar.getYear()}年${leapStr}${lunarMonths[Math.abs(lunar.getMonth()) - 1]}${lunarDays[lunar.getDay() - 1]}`);
      }
    } catch (e) {
      setCorrespondingDate('');
    }
  }, [year, month, day, calendarType, isLeapMonth, leapMonthInYear]);

  useEffect(() => {
    if (calendarType === 'lunar') {
      const ly = LunarYear.fromYear(parseInt(year));
      const lm = ly.getLeapMonth();
      setLeapMonthInYear(lm);
      
      if (lm !== parseInt(month)) {
        setIsLeapMonth(false);
      }
      
      const m = isLeapMonth && lm === parseInt(month) ? -parseInt(month) : parseInt(month);
      const lunarMonthObj = ly.getMonth(m);
      if (lunarMonthObj) {
        const days = lunarMonthObj.getDayCount();
        setDaysInMonth(days);
        if (parseInt(day) > days) {
          setDay(String(days));
        }
      }
    } else {
      const days = new Date(parseInt(year), parseInt(month), 0).getDate();
      setDaysInMonth(days);
      if (parseInt(day) > days) {
        setDay(String(days));
      }
    }
  }, [year, month, calendarType, isLeapMonth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalBirthDate = '';
    if (calendarType === 'lunar') {
      const m = isLeapMonth && leapMonthInYear === parseInt(month) ? -parseInt(month) : parseInt(month);
      const lunar = Lunar.fromYmd(parseInt(year), m, parseInt(day));
      const solar = lunar.getSolar();
      const formattedMonth = String(solar.getMonth()).padStart(2, '0');
      const formattedDay = String(solar.getDay()).padStart(2, '0');
      finalBirthDate = `${solar.getYear()}-${formattedMonth}-${formattedDay}`;
    } else {
      const formattedMonth = month.padStart(2, '0');
      const formattedDay = day.padStart(2, '0');
      finalBirthDate = `${year}-${formattedMonth}-${formattedDay}`;
    }
    onSubmit({ gender, birthDate: finalBirthDate, birthTime, toneMode, isHarshMode, calendarType, isLeapMonth });
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
        <h2 className={`text-3xl font-light tracking-[0.2em] mb-2 transition-colors duration-500 ${isHarshMode ? 'text-red-100' : isSweetMode ? 'text-rose-800' : 'text-ink'}`}>排盘测算</h2>
        <p className={`text-sm tracking-widest transition-colors duration-500 ${isHarshMode ? 'text-red-200/60' : isSweetMode ? 'text-rose-600/70' : 'text-ink/40'}`}>输入生辰，洞悉天机</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Gender Segmented Control */}
        <div className={`p-1.5 rounded-2xl flex relative transition-colors duration-500 ${isHarshMode ? 'bg-black/30' : isSweetMode ? 'bg-rose-100/70' : 'bg-black/5'}`}>
          {['男', '女'].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 py-3 text-sm font-bold tracking-widest rounded-xl transition-all duration-300 z-10 ${
                gender === g 
                  ? (isHarshMode ? 'text-red-950' : isSweetMode ? 'text-rose-800' : 'text-ink') 
                  : (isHarshMode ? 'text-red-200/40 hover:text-red-200/60' : isSweetMode ? 'text-rose-500/70 hover:text-rose-700' : 'text-ink/40 hover:text-ink/60')
              }`}
            >
              {g}命
            </button>
          ))}
          {/* Animated background pill */}
          <div 
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl shadow-sm transition-all duration-300 ease-out ${isHarshMode ? 'bg-red-500' : isSweetMode ? 'bg-rose-200' : 'bg-white'}`}
            style={{ transform: `translateX(${gender === '男' ? '6px' : 'calc(100% + 6px)'})` }}
          />
        </div>

        {/* Date Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between ml-2">
            <label className={`block text-xs font-bold uppercase tracking-widest transition-colors duration-500 ${isHarshMode ? 'text-red-200/40' : isSweetMode ? 'text-rose-600/75' : 'text-ink/40'}`}>
              出生日期
            </label>
            <div className="flex items-center gap-2 mr-2">
              <button
                type="button"
                onClick={() => handleCalendarChange('solar')}
                className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${
                  calendarType === 'solar' 
                    ? (isHarshMode ? 'bg-red-500/20 text-red-200' : isSweetMode ? 'bg-rose-100 text-rose-700' : 'bg-black/10 text-ink') 
                    : (isHarshMode ? 'text-red-200/40 hover:text-red-200' : isSweetMode ? 'text-rose-500/70 hover:text-rose-700' : 'text-ink/40 hover:text-ink')
                }`}
              >
                公历
              </button>
              <button
                type="button"
                onClick={() => handleCalendarChange('lunar')}
                className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${
                  calendarType === 'lunar' 
                    ? (isHarshMode ? 'bg-red-500/20 text-red-200' : isSweetMode ? 'bg-rose-100 text-rose-700' : 'bg-black/10 text-ink') 
                    : (isHarshMode ? 'text-red-200/40 hover:text-red-200' : isSweetMode ? 'text-rose-500/70 hover:text-rose-700' : 'text-ink/40 hover:text-ink')
                }`}
              >
                农历
              </button>
            </div>
          </div>
          
          {calendarType === 'lunar' && leapMonthInYear > 0 && leapMonthInYear === parseInt(month) && (
            <div className="flex items-center justify-end mr-2 mb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isLeapMonth}
                  onChange={(e) => setIsLeapMonth(e.target.checked)}
                  className={`rounded border-gray-300 text-ink focus:ring-ink ${isHarshMode ? 'accent-red-500' : isSweetMode ? 'accent-rose-300' : 'accent-ink'}`}
                />
                <span className={`text-xs font-bold ${isHarshMode ? 'text-red-200/60' : isSweetMode ? 'text-rose-600/80' : 'text-ink/60'}`}>闰月</span>
              </label>
            </div>
          )}

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
              {months.map(m => <option key={m} value={m} className="text-ink">{calendarType === 'lunar' ? lunarMonths[m - 1] : `${m}月`}</option>)}
            </select>
            <div className={`w-[1px] my-2 transition-colors duration-500 ${isHarshMode ? 'bg-white/10' : isSweetMode ? 'bg-rose-200/70' : 'bg-black/10'}`}></div>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className={`flex-1 bg-transparent py-3 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${isHarshMode ? 'text-red-100 hover:bg-white/5' : isSweetMode ? 'text-rose-800 hover:bg-white/50' : 'text-ink hover:bg-black/5'}`}
            >
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                <option key={d} value={d} className="text-ink">{calendarType === 'lunar' ? lunarDays[d - 1] : `${d}日`}</option>
              ))}
            </select>
          </div>
          
          {correspondingDate && (
            <div className={`text-xs text-center mt-2 transition-colors duration-500 ${isHarshMode ? 'text-red-200/60' : isSweetMode ? 'text-rose-600/80' : 'text-ink/60'}`}>
              {correspondingDate}
            </div>
          )}
        </div>

        {/* Time Selector */}
        <div className="space-y-3">
          <label className={`block text-xs font-bold uppercase tracking-widest ml-2 transition-colors duration-500 ${isHarshMode ? 'text-red-200/40' : isSweetMode ? 'text-rose-600/75' : 'text-ink/40'}`}>出生时间</label>
          <div className={`rounded-2xl p-1 transition-colors duration-500 ${isHarshMode ? 'bg-black/30' : isSweetMode ? 'bg-rose-100/70' : 'bg-black/5'}`}>
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              required
              className={`w-full bg-transparent py-3 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${isHarshMode ? 'text-red-100 hover:bg-white/5' : isSweetMode ? 'text-rose-800 hover:bg-white/50' : 'text-ink hover:bg-black/5'}`}
            />
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
          {isLoading ? '推演中...' : '开始测算'}
        </button>
      </form>
    </motion.div>
  );
}
