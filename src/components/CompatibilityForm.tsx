import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Heart, User, Calendar, Clock, Sparkles } from 'lucide-react';
import { Lunar, LunarYear, Solar } from 'lunar-javascript';
import type { ToneMode } from '../types/toneMode';

interface CompatibilityFormProps {
  onSubmit: (data: {
    gender1: string;
    birthDate1: string;
    birthTime1: string;
    calendarType1: string;
    isLeapMonth1: boolean;
    gender2: string;
    birthDate2: string;
    birthTime2: string;
    calendarType2: string;
    isLeapMonth2: boolean;
    toneMode: ToneMode;
    isHarshMode: boolean;
  }) => void;
  isLoading: boolean;
}

export default function CompatibilityForm({ onSubmit, isLoading }: CompatibilityFormProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const [gender1, setGender1] = useState('男');
  const [calendarType1, setCalendarType1] = useState<'solar' | 'lunar'>('solar');
  const [year1, setYear1] = useState(String(currentYear - 30));
  const [month1, setMonth1] = useState('1');
  const [day1, setDay1] = useState('1');
  const [isLeapMonth1, setIsLeapMonth1] = useState(false);
  const [leapMonthInYear1, setLeapMonthInYear1] = useState(0);
  const [birthTime1, setBirthTime1] = useState('12:00');
  const [daysInMonth1, setDaysInMonth1] = useState(31);
  
  const [gender2, setGender2] = useState('女');
  const [calendarType2, setCalendarType2] = useState<'solar' | 'lunar'>('solar');
  const [year2, setYear2] = useState(String(currentYear - 30));
  const [month2, setMonth2] = useState('1');
  const [day2, setDay2] = useState('1');
  const [isLeapMonth2, setIsLeapMonth2] = useState(false);
  const [leapMonthInYear2, setLeapMonthInYear2] = useState(0);
  const [birthTime2, setBirthTime2] = useState('12:00');
  const [daysInMonth2, setDaysInMonth2] = useState(31);
  const [correspondingDate1, setCorrespondingDate1] = useState('');
  const [correspondingDate2, setCorrespondingDate2] = useState('');
  
  const [toneMode, setToneMode] = useState<ToneMode>('default');
  const isHarshMode = toneMode === 'harsh';
  const isSweetMode = toneMode === 'sweet';

  const lunarMonths = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月'];
  const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

  const handleCalendarChange1 = (type: 'solar' | 'lunar') => {
    if (type === calendarType1) return;
    if (type === 'lunar') {
      const solar = Solar.fromYmd(parseInt(year1), parseInt(month1), parseInt(day1));
      const lunar = solar.getLunar();
      setYear1(String(lunar.getYear()));
      setMonth1(String(Math.abs(lunar.getMonth())));
      setDay1(String(lunar.getDay()));
      setIsLeapMonth1(lunar.getMonth() < 0);
    } else {
      const m = isLeapMonth1 && leapMonthInYear1 === parseInt(month1) ? -parseInt(month1) : parseInt(month1);
      const lunar = Lunar.fromYmd(parseInt(year1), m, parseInt(day1));
      const solar = lunar.getSolar();
      setYear1(String(solar.getYear()));
      setMonth1(String(solar.getMonth()));
      setDay1(String(solar.getDay()));
      setIsLeapMonth1(false);
    }
    setCalendarType1(type);
  };

  const handleCalendarChange2 = (type: 'solar' | 'lunar') => {
    if (type === calendarType2) return;
    if (type === 'lunar') {
      const solar = Solar.fromYmd(parseInt(year2), parseInt(month2), parseInt(day2));
      const lunar = solar.getLunar();
      setYear2(String(lunar.getYear()));
      setMonth2(String(Math.abs(lunar.getMonth())));
      setDay2(String(lunar.getDay()));
      setIsLeapMonth2(lunar.getMonth() < 0);
    } else {
      const m = isLeapMonth2 && leapMonthInYear2 === parseInt(month2) ? -parseInt(month2) : parseInt(month2);
      const lunar = Lunar.fromYmd(parseInt(year2), m, parseInt(day2));
      const solar = lunar.getSolar();
      setYear2(String(solar.getYear()));
      setMonth2(String(solar.getMonth()));
      setDay2(String(solar.getDay()));
      setIsLeapMonth2(false);
    }
    setCalendarType2(type);
  };

  useEffect(() => {
    try {
      if (calendarType1 === 'lunar') {
        const m = isLeapMonth1 && leapMonthInYear1 === parseInt(month1) ? -parseInt(month1) : parseInt(month1);
        const lunar = Lunar.fromYmd(parseInt(year1), m, parseInt(day1));
        const solar = lunar.getSolar();
        setCorrespondingDate1(`对应公历：${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`);
      } else {
        const solar = Solar.fromYmd(parseInt(year1), parseInt(month1), parseInt(day1));
        const lunar = solar.getLunar();
        const leapStr = lunar.getMonth() < 0 ? '闰' : '';
        setCorrespondingDate1(`对应农历：${lunar.getYear()}年${leapStr}${lunarMonths[Math.abs(lunar.getMonth()) - 1]}${lunarDays[lunar.getDay() - 1]}`);
      }
    } catch (e) {
      setCorrespondingDate1('');
    }
  }, [year1, month1, day1, calendarType1, isLeapMonth1, leapMonthInYear1]);

  useEffect(() => {
    try {
      if (calendarType2 === 'lunar') {
        const m = isLeapMonth2 && leapMonthInYear2 === parseInt(month2) ? -parseInt(month2) : parseInt(month2);
        const lunar = Lunar.fromYmd(parseInt(year2), m, parseInt(day2));
        const solar = lunar.getSolar();
        setCorrespondingDate2(`对应公历：${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`);
      } else {
        const solar = Solar.fromYmd(parseInt(year2), parseInt(month2), parseInt(day2));
        const lunar = solar.getLunar();
        const leapStr = lunar.getMonth() < 0 ? '闰' : '';
        setCorrespondingDate2(`对应农历：${lunar.getYear()}年${leapStr}${lunarMonths[Math.abs(lunar.getMonth()) - 1]}${lunarDays[lunar.getDay() - 1]}`);
      }
    } catch (e) {
      setCorrespondingDate2('');
    }
  }, [year2, month2, day2, calendarType2, isLeapMonth2, leapMonthInYear2]);

  useEffect(() => {
    if (calendarType1 === 'lunar') {
      const ly = LunarYear.fromYear(parseInt(year1));
      const lm = ly.getLeapMonth();
      setLeapMonthInYear1(lm);
      
      if (lm !== parseInt(month1)) {
        setIsLeapMonth1(false);
      }
      
      const m = isLeapMonth1 && lm === parseInt(month1) ? -parseInt(month1) : parseInt(month1);
      const lunarMonthObj = ly.getMonth(m);
      if (lunarMonthObj) {
        const days = lunarMonthObj.getDayCount();
        setDaysInMonth1(days);
        if (parseInt(day1) > days) {
          setDay1(String(days));
        }
      }
    } else {
      const days = new Date(parseInt(year1), parseInt(month1), 0).getDate();
      setDaysInMonth1(days);
      if (parseInt(day1) > days) {
        setDay1(String(days));
      }
    }
  }, [year1, month1, calendarType1, isLeapMonth1]);

  useEffect(() => {
    if (calendarType2 === 'lunar') {
      const ly = LunarYear.fromYear(parseInt(year2));
      const lm = ly.getLeapMonth();
      setLeapMonthInYear2(lm);
      
      if (lm !== parseInt(month2)) {
        setIsLeapMonth2(false);
      }
      
      const m = isLeapMonth2 && lm === parseInt(month2) ? -parseInt(month2) : parseInt(month2);
      const lunarMonthObj = ly.getMonth(m);
      if (lunarMonthObj) {
        const days = lunarMonthObj.getDayCount();
        setDaysInMonth2(days);
        if (parseInt(day2) > days) {
          setDay2(String(days));
        }
      }
    } else {
      const days = new Date(parseInt(year2), parseInt(month2), 0).getDate();
      setDaysInMonth2(days);
      if (parseInt(day2) > days) {
        setDay2(String(days));
      }
    }
  }, [year2, month2, calendarType2, isLeapMonth2]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalBirthDate1 = '';
    if (calendarType1 === 'lunar') {
      const m = isLeapMonth1 && leapMonthInYear1 === parseInt(month1) ? -parseInt(month1) : parseInt(month1);
      const lunar = Lunar.fromYmd(parseInt(year1), m, parseInt(day1));
      const solar = lunar.getSolar();
      const formattedMonth = String(solar.getMonth()).padStart(2, '0');
      const formattedDay = String(solar.getDay()).padStart(2, '0');
      finalBirthDate1 = `${solar.getYear()}-${formattedMonth}-${formattedDay}`;
    } else {
      finalBirthDate1 = `${year1}-${month1.padStart(2, '0')}-${day1.padStart(2, '0')}`;
    }

    let finalBirthDate2 = '';
    if (calendarType2 === 'lunar') {
      const m = isLeapMonth2 && leapMonthInYear2 === parseInt(month2) ? -parseInt(month2) : parseInt(month2);
      const lunar = Lunar.fromYmd(parseInt(year2), m, parseInt(day2));
      const solar = lunar.getSolar();
      const formattedMonth = String(solar.getMonth()).padStart(2, '0');
      const formattedDay = String(solar.getDay()).padStart(2, '0');
      finalBirthDate2 = `${solar.getYear()}-${formattedMonth}-${formattedDay}`;
    } else {
      finalBirthDate2 = `${year2}-${month2.padStart(2, '0')}-${day2.padStart(2, '0')}`;
    }
    
    onSubmit({ gender1, birthDate1: finalBirthDate1, birthTime1, calendarType1, isLeapMonth1, gender2, birthDate2: finalBirthDate2, birthTime2, calendarType2, isLeapMonth2, toneMode, isHarshMode });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`w-full max-w-2xl mx-auto backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl border transition-colors duration-500 ${
        isHarshMode ? 'bg-red-950/90 border-red-500/30' : isSweetMode ? 'bg-rose-50/92 border-rose-200/60' : 'bg-white/80 border-white/50'
      }`}
    >
      <div className="text-center mb-10">
        <Heart className={`w-12 h-12 mx-auto mb-4 transition-colors duration-500 ${isHarshMode ? 'text-red-500' : isSweetMode ? 'text-rose-400' : 'text-cinnabar'}`} />
        <h2 className={`text-3xl font-light tracking-[0.2em] mb-2 transition-colors duration-500 ${isHarshMode ? 'text-red-100' : isSweetMode ? 'text-rose-800' : 'text-ink'}`}>八字合盘</h2>
        <p className={`text-sm tracking-widest transition-colors duration-500 ${isHarshMode ? 'text-red-200/60' : isSweetMode ? 'text-rose-600/70' : 'text-ink/40'}`}>洞悉情感纠葛，探寻相处之道</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Person 1 */}
          <div className={`space-y-6 p-6 rounded-2xl border transition-colors duration-500 ${isHarshMode ? 'bg-black/30 border-red-900/30' : isSweetMode ? 'bg-rose-50/85 border-rose-200/70' : 'bg-ink/5 border-ink/10'}`}>
            <h3 className={`text-lg font-bold text-center tracking-widest border-b pb-2 transition-colors duration-500 ${isHarshMode ? 'text-red-100 border-red-900/30' : isSweetMode ? 'text-rose-800 border-rose-200/70' : 'text-ink border-ink/10'}`}>主测人</h3>
            
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium transition-colors duration-500 ${isHarshMode ? 'text-red-200/60' : isSweetMode ? 'text-rose-700/80' : 'text-ink/80'}`}>
                <User className="w-4 h-4" /> 性别
              </label>
              <div className={`p-1.5 rounded-2xl flex relative transition-colors duration-500 ${isHarshMode ? 'bg-black/30' : isSweetMode ? 'bg-rose-100/70' : 'bg-black/5'}`}>
                {['男', '女'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender1(g)}
                    className={`flex-1 py-2 text-sm font-bold tracking-widest rounded-xl transition-all duration-300 z-10 ${
                      gender1 === g 
                        ? (isHarshMode ? 'text-red-950' : isSweetMode ? 'text-rose-800' : 'text-ink') 
                        : (isHarshMode ? 'text-red-200/40 hover:text-red-200/60' : isSweetMode ? 'text-rose-500/70 hover:text-rose-700' : 'text-ink/40 hover:text-ink/60')
                    }`}
                  >
                    {g}
                  </button>
                ))}
                <div 
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl shadow-sm transition-all duration-300 ease-out ${isHarshMode ? 'bg-red-500' : isSweetMode ? 'bg-rose-200' : 'bg-white'}`}
                  style={{ transform: `translateX(${gender1 === '男' ? '6px' : 'calc(100% + 6px)'})` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`flex items-center gap-2 text-sm font-medium transition-colors duration-500 ${isHarshMode ? 'text-red-200/60' : isSweetMode ? 'text-rose-800/80' : 'text-ink/80'}`}>
                  <Calendar className="w-4 h-4" /> 出生日期
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCalendarChange1('solar')}
                    className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${
                      calendarType1 === 'solar' 
                        ? (isHarshMode ? 'bg-red-500/20 text-red-200' : isSweetMode ? 'bg-rose-100 text-rose-700' : 'bg-black/10 text-ink') 
                        : (isHarshMode ? 'text-red-200/40 hover:text-red-200' : isSweetMode ? 'text-rose-500/70 hover:text-rose-700' : 'text-ink/40 hover:text-ink')
                    }`}
                  >
                    公历
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalendarChange1('lunar')}
                    className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${
                      calendarType1 === 'lunar' 
                        ? (isHarshMode ? 'bg-red-500/20 text-red-200' : isSweetMode ? 'bg-rose-100 text-rose-700' : 'bg-black/10 text-ink') 
                        : (isHarshMode ? 'text-red-200/40 hover:text-red-200' : isSweetMode ? 'text-rose-500/70 hover:text-rose-700' : 'text-ink/40 hover:text-ink')
                    }`}
                  >
                    农历
                  </button>
                </div>
              </div>

              {calendarType1 === 'lunar' && leapMonthInYear1 > 0 && leapMonthInYear1 === parseInt(month1) && (
                <div className="flex items-center justify-end mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isLeapMonth1}
                      onChange={(e) => setIsLeapMonth1(e.target.checked)}
                      className={`rounded border-gray-300 text-ink focus:ring-ink ${isHarshMode ? 'accent-red-500' : isSweetMode ? 'accent-rose-300' : 'accent-ink'}`}
                    />
                    <span className={`text-xs font-bold ${isHarshMode ? 'text-red-200/60' : isSweetMode ? 'text-rose-600/80' : 'text-ink/60'}`}>闰月</span>
                  </label>
                </div>
              )}

              <div className={`flex rounded-2xl p-1 transition-colors duration-500 ${isHarshMode ? 'bg-black/30' : 'bg-black/5'}`}>
                <select
                  value={year1}
                  onChange={(e) => setYear1(e.target.value)}
                  className={`flex-1 bg-transparent py-2 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${isHarshMode ? 'text-red-100 hover:bg-white/5' : 'text-ink hover:bg-black/5'}`}
                >
                  {years.map(y => <option key={y} value={y} className="text-ink">{y}年</option>)}
                </select>
                <div className={`w-[1px] my-2 transition-colors duration-500 ${isHarshMode ? 'bg-white/10' : 'bg-black/10'}`}></div>
                <select
                  value={month1}
                  onChange={(e) => setMonth1(e.target.value)}
                  className={`flex-1 bg-transparent py-2 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${isHarshMode ? 'text-red-100 hover:bg-white/5' : 'text-ink hover:bg-black/5'}`}
                >
                  {months.map(m => <option key={m} value={m} className="text-ink">{calendarType1 === 'lunar' ? lunarMonths[m - 1] : `${m}月`}</option>)}
                </select>
                <div className={`w-[1px] my-2 transition-colors duration-500 ${isHarshMode ? 'bg-white/10' : 'bg-black/10'}`}></div>
                <select
                  value={day1}
                  onChange={(e) => setDay1(e.target.value)}
                  className={`flex-1 bg-transparent py-2 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${isHarshMode ? 'text-red-100 hover:bg-white/5' : 'text-ink hover:bg-black/5'}`}
                >
                  {Array.from({ length: daysInMonth1 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d} className="text-ink">{calendarType1 === 'lunar' ? lunarDays[d - 1] : `${d}日`}</option>
                  ))}
                </select>
              </div>
              
              {correspondingDate1 && (
                <div className={`text-xs text-center mt-2 transition-colors duration-500 ${isHarshMode ? 'text-red-200/60' : 'text-ink/60'}`}>
                  {correspondingDate1}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium transition-colors duration-500 ${isHarshMode ? 'text-red-200/60' : 'text-ink/80'}`}>
                <Clock className="w-4 h-4" /> 出生时间
              </label>
              <div className={`rounded-2xl p-1 transition-colors duration-500 ${isHarshMode ? 'bg-black/30' : 'bg-black/5'}`}>
                <input
                  type="time"
                  required
                  value={birthTime1}
                  onChange={(e) => setBirthTime1(e.target.value)}
                  className={`w-full bg-transparent px-4 py-2 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${isHarshMode ? 'text-red-100 hover:bg-white/5' : 'text-ink hover:bg-black/5'}`}
                />
              </div>
            </div>
          </div>

          {/* Person 2 */}
          <div className={`space-y-6 p-6 rounded-2xl border transition-colors duration-500 ${isHarshMode ? 'bg-black/30 border-red-900/30' : isSweetMode ? 'bg-rose-50/85 border-rose-200/70' : 'bg-ink/5 border-ink/10'}`}>
            <h3 className={`text-lg font-bold text-center tracking-widest border-b pb-2 transition-colors duration-500 ${isHarshMode ? 'text-red-100 border-red-900/30' : isSweetMode ? 'text-rose-800 border-rose-200/70' : 'text-ink border-ink/10'}`}>合测人</h3>
            
            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium transition-colors duration-500 ${isHarshMode ? 'text-red-200/60' : isSweetMode ? 'text-rose-700/80' : 'text-ink/80'}`}>
                <User className="w-4 h-4" /> 性别
              </label>
              <div className={`p-1.5 rounded-2xl flex relative transition-colors duration-500 ${isHarshMode ? 'bg-black/30' : isSweetMode ? 'bg-rose-100/70' : 'bg-black/5'}`}>
                {['男', '女'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender2(g)}
                    className={`flex-1 py-2 text-sm font-bold tracking-widest rounded-xl transition-all duration-300 z-10 ${
                      gender2 === g 
                        ? (isHarshMode ? 'text-red-950' : isSweetMode ? 'text-rose-800' : 'text-ink') 
                        : (isHarshMode ? 'text-red-200/40 hover:text-red-200/60' : isSweetMode ? 'text-rose-500/70 hover:text-rose-700' : 'text-ink/40 hover:text-ink/60')
                    }`}
                  >
                    {g}
                  </button>
                ))}
                <div 
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl shadow-sm transition-all duration-300 ease-out ${isHarshMode ? 'bg-red-500' : isSweetMode ? 'bg-rose-200' : 'bg-white'}`}
                  style={{ transform: `translateX(${gender2 === '男' ? '6px' : 'calc(100% + 6px)'})` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`flex items-center gap-2 text-sm font-medium transition-colors duration-500 ${isHarshMode ? 'text-red-200/60' : isSweetMode ? 'text-rose-800/80' : 'text-ink/80'}`}>
                  <Calendar className="w-4 h-4" /> 出生日期
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCalendarChange2('solar')}
                    className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${
                      calendarType2 === 'solar' 
                        ? (isHarshMode ? 'bg-red-500/20 text-red-200' : isSweetMode ? 'bg-rose-100 text-rose-700' : 'bg-black/10 text-ink') 
                        : (isHarshMode ? 'text-red-200/40 hover:text-red-200' : isSweetMode ? 'text-rose-500/70 hover:text-rose-700' : 'text-ink/40 hover:text-ink')
                    }`}
                  >
                    公历
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalendarChange2('lunar')}
                    className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${
                      calendarType2 === 'lunar' 
                        ? (isHarshMode ? 'bg-red-500/20 text-red-200' : isSweetMode ? 'bg-rose-100 text-rose-700' : 'bg-black/10 text-ink') 
                        : (isHarshMode ? 'text-red-200/40 hover:text-red-200' : isSweetMode ? 'text-rose-500/70 hover:text-rose-700' : 'text-ink/40 hover:text-ink')
                    }`}
                  >
                    农历
                  </button>
                </div>
              </div>

              {calendarType2 === 'lunar' && leapMonthInYear2 > 0 && leapMonthInYear2 === parseInt(month2) && (
                <div className="flex items-center justify-end mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isLeapMonth2}
                      onChange={(e) => setIsLeapMonth2(e.target.checked)}
                      className={`rounded border-gray-300 text-ink focus:ring-ink ${isHarshMode ? 'accent-red-500' : isSweetMode ? 'accent-rose-300' : 'accent-ink'}`}
                    />
                    <span className={`text-xs font-bold ${isHarshMode ? 'text-red-200/60' : isSweetMode ? 'text-rose-600/80' : 'text-ink/60'}`}>闰月</span>
                  </label>
                </div>
              )}

              <div className={`flex rounded-2xl p-1 transition-colors duration-500 ${isHarshMode ? 'bg-black/30' : 'bg-black/5'}`}>
                <select
                  value={year2}
                  onChange={(e) => setYear2(e.target.value)}
                  className={`flex-1 bg-transparent py-2 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${isHarshMode ? 'text-red-100 hover:bg-white/5' : 'text-ink hover:bg-black/5'}`}
                >
                  {years.map(y => <option key={y} value={y} className="text-ink">{y}年</option>)}
                </select>
                <div className={`w-[1px] my-2 transition-colors duration-500 ${isHarshMode ? 'bg-white/10' : 'bg-black/10'}`}></div>
                <select
                  value={month2}
                  onChange={(e) => setMonth2(e.target.value)}
                  className={`flex-1 bg-transparent py-2 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${isHarshMode ? 'text-red-100 hover:bg-white/5' : 'text-ink hover:bg-black/5'}`}
                >
                  {months.map(m => <option key={m} value={m} className="text-ink">{calendarType2 === 'lunar' ? lunarMonths[m - 1] : `${m}月`}</option>)}
                </select>
                <div className={`w-[1px] my-2 transition-colors duration-500 ${isHarshMode ? 'bg-white/10' : 'bg-black/10'}`}></div>
                <select
                  value={day2}
                  onChange={(e) => setDay2(e.target.value)}
                  className={`flex-1 bg-transparent py-2 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${isHarshMode ? 'text-red-100 hover:bg-white/5' : 'text-ink hover:bg-black/5'}`}
                >
                  {Array.from({ length: daysInMonth2 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d} className="text-ink">{calendarType2 === 'lunar' ? lunarDays[d - 1] : `${d}日`}</option>
                  ))}
                </select>
              </div>
              
              {correspondingDate2 && (
                <div className={`text-xs text-center mt-2 transition-colors duration-500 ${isHarshMode ? 'text-red-200/60' : 'text-ink/60'}`}>
                  {correspondingDate2}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className={`flex items-center gap-2 text-sm font-medium transition-colors duration-500 ${isHarshMode ? 'text-red-200/60' : 'text-ink/80'}`}>
                <Clock className="w-4 h-4" /> 出生时间
              </label>
              <div className={`rounded-2xl p-1 transition-colors duration-500 ${isHarshMode ? 'bg-black/30' : 'bg-black/5'}`}>
                <input
                  type="time"
                  required
                  value={birthTime2}
                  onChange={(e) => setBirthTime2(e.target.value)}
                  className={`w-full bg-transparent px-4 py-2 text-center appearance-none outline-none font-medium cursor-pointer rounded-xl transition-colors ${isHarshMode ? 'text-red-100 hover:bg-white/5' : 'text-ink hover:bg-black/5'}`}
                />
              </div>
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
          className={`w-full py-4 rounded-2xl font-bold text-lg tracking-[0.2em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl mt-4 flex items-center justify-center gap-2 relative overflow-hidden group ${
            isHarshMode 
              ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-900/50' 
              : isSweetMode
                ? 'bg-rose-300 text-rose-800 hover:bg-rose-200 shadow-rose-200/50'
              : 'bg-ink text-paper hover:bg-ink/90 shadow-ink/10'
          }`}
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          <span className="relative flex items-center gap-2">
            {isLoading ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                推演中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                开始合盘
              </>
            )}
          </span>
        </button>
      </form>
    </motion.div>
  );
}
