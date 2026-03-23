import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BasicFortuneResult, 
  DayunPhase, 
  calculateDailyFortune, 
  DailyFortuneResult, 
  calculateDayunFortuneWithRetry,
  calculateSingleDayunLiunian
} from '../services/fortuneService';
import { Scroll, Heart, Coins, Activity, Wind, Compass, Sparkles, Calendar as CalendarIcon, Loader2, TrendingUp, Briefcase, Users, User, Download, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { shareAsImage } from '../utils/shareUtils';
import StreamingTextPanel from './StreamingTextPanel';
import type { ToneMode } from '../types/toneMode';

interface BaziResultProps {
  result: BasicFortuneResult; 
  birthInfo: { gender: string; birthDate: string; birthTime: string; toneMode?: ToneMode; isHarshMode?: boolean; calendarType?: string; isLeapMonth?: boolean };
  onReset: () => void;
}

export default function BaziResult({ result, birthInfo, onReset }: BaziResultProps) {
  const SHARE_CARD_ID = 'bazi-share-card';
  const pillars = [
    { label: '年柱', data: result.bazi.year, delay: 0.1 },
    { label: '月柱', data: result.bazi.month, delay: 0.2 },
    { label: '日柱', data: result.bazi.day, delay: 0.3 },
    { label: '时柱', data: result.bazi.hour, delay: 0.4 },
  ];

  const wuxingColors = {
    metal: { bg: 'bg-[#eab308]', label: '金' },
    wood: { bg: 'bg-[#22c55e]', label: '木' },
    water: { bg: 'bg-[#3b82f6]', label: '水' },
    fire: { bg: 'bg-[#ef4444]', label: '火' },
    earth: { bg: 'bg-[#a16207]', label: '土' },
  };

  const [overallTab, setOverallTab] = useState('overall');

  // Dayun Async State
  const [dayunList, setDayunList] = useState<DayunPhase[] | null>(null);
  const [isDayunLoading, setIsDayunLoading] = useState(true);
  const [dayunFetchError, setDayunFetchError] = useState(false);
  const [dayunProgress, setDayunProgress] = useState({ current: 0, total: 8 });
  const [dayunStreamText, setDayunStreamText] = useState('');
  const [liunianStreamText, setLiunianStreamText] = useState('');

  const fetchedBirthInfoRef = useRef<string | null>(null);
  const dayunAbortRef = useRef<AbortController | null>(null);
  const liunianAbortRef = useRef<AbortController | null>(null);
  const dailyAbortRef = useRef<AbortController | null>(null);

  // Calendar State
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyFortune, setDailyFortune] = useState<DailyFortuneResult | null>(null);
  const [isLoadingFortune, setIsLoadingFortune] = useState(false);
  const [fortuneError, setFortuneError] = useState<string | null>(null);
  const [dailyStreamText, setDailyStreamText] = useState('');

  // Dayun Component State
  const [selectedDayun, setSelectedDayun] = useState(0);
  const [selectedLiunian, setSelectedLiunian] = useState<number | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [fetchingLiunianIndex, setFetchingLiunianIndex] = useState<number | null>(null);
  const fetchingLiunianRef = useRef<number | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const [visibleLines, setVisibleLines] = useState({
    score: true,
    wealthScore: true,
    emotionScore: true,
    careerScore: false,
    healthScore: false,
  });

  const [dayunTab, setDayunTab] = useState('wealth');
  const [liunianTab, setLiunianTab] = useState('wealth');
  const isAbortError = (error: unknown) =>
    error instanceof DOMException && error.name === 'AbortError';
  const summarySections = [
    { id: 'overall', title: '整体命格', content: result.overall },
    { id: 'character', title: '性格特质', content: result.character },
    { id: 'wuxing', title: '五行喜忌', content: result.wuxing },
    { id: 'health', title: '健康调候', content: result.health },
    { id: 'wealth', title: '一生财运', content: result.wealthSummary },
    { id: 'career', title: '一生事业', content: result.careerSummary },
    { id: 'emotion', title: '一生情感', content: result.emotionSummary },
    { id: 'family', title: '一生家庭', content: result.familySummary },
  ];
  const buildScoreSections = (target: {
    wealthScore: number;
    emotionScore: number;
    careerScore: number;
    familyScore: number;
    healthScore: number;
    wealthDescription: string;
    emotionDescription: string;
    careerDescription: string;
    familyDescription: string;
    healthDescription: string;
  }) => [
    { id: 'wealth', label: '财运', score: target.wealthScore, description: target.wealthDescription, accent: 'text-[#b45309]', chip: 'bg-[#fff7d6] border-[#f3d58d]' },
    { id: 'emotion', label: '情感', score: target.emotionScore, description: target.emotionDescription, accent: 'text-[#dc2626]', chip: 'bg-[#fff1f2] border-[#fecdd3]' },
    { id: 'career', label: '事业', score: target.careerScore, description: target.careerDescription, accent: 'text-[#2563eb]', chip: 'bg-[#eff6ff] border-[#bfdbfe]' },
    { id: 'family', label: '家庭', score: target.familyScore, description: target.familyDescription, accent: 'text-[#7c3aed]', chip: 'bg-[#f5f3ff] border-[#ddd6fe]' },
    { id: 'health', label: '健康', score: target.healthScore, description: target.healthDescription, accent: 'text-[#059669]', chip: 'bg-[#ecfdf5] border-[#a7f3d0]' },
  ];
  const selectedDayunPhase = dayunList && dayunList[selectedDayun] ? dayunList[selectedDayun] : null;
  const selectedLiunianItem =
    selectedDayunPhase && selectedLiunian !== null && selectedDayunPhase.liunian?.[selectedLiunian]
      ? selectedDayunPhase.liunian[selectedLiunian]
      : null;

  const fetchDayunData = async () => {
    dayunAbortRef.current?.abort();
    const controller = new AbortController();
    dayunAbortRef.current = controller;
    setIsDayunLoading(true);
    setDayunFetchError(false);
    setDayunList([]);
    setDayunProgress({ current: 0, total: 8 });
    setDayunStreamText('');

    try {
      await calculateDayunFortuneWithRetry(
        birthInfo.gender, 
        birthInfo.birthDate, 
        birthInfo.birthTime, 
        birthInfo.toneMode ?? (birthInfo.isHarshMode ? 'harsh' : 'default'),
        3, 
        (newPhases, currentLoaded, total) => {
          setDayunList(prev => {
            const newList = prev ? [...prev] : [];
            newList.push(...newPhases); 
            return newList;
          });
          setDayunProgress({ current: currentLoaded, total });
          // 当第一批（前2个大运）数据到达时，取消全局的 Loading
          if (currentLoaded >= Math.min(2, total)) {
            setIsDayunLoading(false);
          }
        },
        true,
        {
          onTextDelta: (text) => setDayunStreamText(text),
          signal: controller.signal,
        }
      );

      // 大运计算结束，不再自动请求流年信息，改为用户手动推演

    } catch (e) {
      if (isAbortError(e)) {
        return;
      }
      console.error(e);
      setDayunList(prev => {
        if (!prev || prev.length === 0) {
          setDayunFetchError(true);
          setIsDayunLoading(false);
        } else {
          setDayunFetchError(true);
        }
        return prev;
      });
    } finally {
      if (dayunAbortRef.current === controller) {
        dayunAbortRef.current = null;
      }
    }
  };

  const fetchSingleDayunLiunian = async (index: number, isAutoFetch: boolean = false) => {
    if (fetchingLiunianRef.current !== null) return;
    
    // Check if liunian data already exists
    if (dayunList && dayunList[index] && dayunList[index].liunian && dayunList[index].liunian.length > 0) {
      return;
    }

    liunianAbortRef.current?.abort();
    const controller = new AbortController();
    liunianAbortRef.current = controller;
    fetchingLiunianRef.current = index;
    setFetchingLiunianIndex(index);
    setLiunianStreamText('');
    try {
      const fullPhase = await calculateSingleDayunLiunian(
        birthInfo.gender,
        birthInfo.birthDate,
        birthInfo.birthTime,
        birthInfo.toneMode ?? (birthInfo.isHarshMode ? 'harsh' : 'default'),
        index,
        3,
        {
          onTextDelta: (text) => setLiunianStreamText(text),
          signal: controller.signal,
        }
      );
      
      setDayunList(prev => {
        if (!prev) return prev;
        const newList = [...prev];
        newList[index] = fullPhase;
        return newList;
      });
      setSelectedLiunian(0); // 默认选中第一个流年
    } catch (e) {
      if (isAbortError(e)) {
        return;
      }
      console.error("Failed to fetch liunian for dayun", index, e);
      if (!isAutoFetch) {
        alert("推演流年失败，请稍后重试。");
      }
    } finally {
      if (liunianAbortRef.current === controller) {
        liunianAbortRef.current = null;
      }
      fetchingLiunianRef.current = null;
      setFetchingLiunianIndex(null);
    }
  };

  useEffect(() => {
    const currentInfoKey = JSON.stringify(birthInfo);
    if (fetchedBirthInfoRef.current === currentInfoKey) {
      return; 
    }
    fetchedBirthInfoRef.current = currentInfoKey;
    
    fetchDayunData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [birthInfo]);

  useEffect(() => {
    return () => {
      dayunAbortRef.current?.abort();
      liunianAbortRef.current?.abort();
      dailyAbortRef.current?.abort();
    };
  }, []);

  const toggleLine = (key: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const dayunDataChart = Array.isArray(dayunList) ? dayunList.map(d => ({
    name: d.ganzhi,
    period: d.period,
    score: d.score || 50,
    wealthScore: d.wealthScore || 50,
    emotionScore: d.emotionScore || 50,
    careerScore: d.careerScore || 50,
    healthScore: d.healthScore || 50,
    liunian: d.liunian || []
  })) : [];

  const handleShare = async () => {
    setIsGeneratingImage(true);
    try {
      await shareAsImage(SHARE_CARD_ID, `bazi_result_${new Date().getTime()}.png`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const fetchFortune = async () => {
    dailyAbortRef.current?.abort();
    const controller = new AbortController();
    dailyAbortRef.current = controller;
    setIsLoadingFortune(true);
    setFortuneError(null);
    setDailyStreamText('');
    try {
      const res = await calculateDailyFortune(birthInfo.gender, birthInfo.birthDate, birthInfo.birthTime, targetDate, {
        onTextDelta: (text) => setDailyStreamText(text),
        signal: controller.signal,
      });
      setDailyFortune(res);
    } catch (e: any) {
      if (isAbortError(e)) {
        return;
      }
      setFortuneError(e.message || '获取运势失败');
    } finally {
      if (dailyAbortRef.current === controller) {
        dailyAbortRef.current = null;
      }
      setIsLoadingFortune(false);
    }
  };

  const renderOverallContent = () => {
    switch(overallTab) {
      case 'overall': return <ResultSection icon={<Scroll />} title="整体命格" content={result.overall} />;
      case 'character': return <ResultSection icon={<User />} title="性格特质" content={result.character} />;
      case 'wuxing': return <ResultSection icon={<Wind />} title="五行喜忌" content={result.wuxing} />;
      case 'health': return <ResultSection icon={<Activity />} title="健康调候" content={result.health} />;
      case 'wealth': return <ResultSection icon={<Coins />} title="一生财运" content={result.wealthSummary} />;
      case 'career': return <ResultSection icon={<Briefcase />} title="一生事业" content={result.careerSummary} />;
      case 'emotion': return <ResultSection icon={<Heart />} title="一生情感" content={result.emotionSummary} />;
      case 'family': return <ResultSection icon={<Users />} title="一生家庭" content={result.familySummary} />;
      default: return null;
    }
  };

  const renderStreamPanel = (
    title: string,
    text: string,
    tone: 'cinnabar' | 'jade' = 'cinnabar',
    maxHeightClassName?: string
  ) => {
    if (!text) return null;

    return (
      <StreamingTextPanel
        title={title}
        text={text}
        tone={tone}
        maxHeightClassName={maxHeightClassName}
      />
    );
  };

  return (
    <motion.div 
      ref={resultRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-5xl mx-auto space-y-12 pb-12 px-4 md:px-0"
    >
      {/* 核心命盘展示区 */}
      <div className="relative bg-ink text-paper rounded-[2.5rem] p-8 md:p-16 shadow-2xl overflow-hidden border border-gold/20">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gold/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-cinnabar/5 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>
        
        <Compass className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] text-paper/[0.02] pointer-events-none" />

        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h3 className="inline-flex items-center gap-3 text-gold text-2xl tracking-[0.5em] font-light border-b border-gold/20 pb-4 px-8">
              <Sparkles className="w-5 h-5" />
              四柱八字
              <Sparkles className="w-5 h-5" />
            </h3>
            <p className="mt-4 text-sm tracking-widest text-paper/60">
              {birthInfo.gender}命 · {birthInfo.calendarType === 'lunar' ? `农历 ${birthInfo.birthDate.split('-')[0]}年${birthInfo.isLeapMonth ? '闰' : ''}${birthInfo.birthDate.split('-')[1]}月${birthInfo.birthDate.split('-')[2]}日` : `公历 ${birthInfo.birthDate.replace(/-/g, '/')}`} {birthInfo.birthTime}
            </p>
          </motion.div>
          
          <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-12 mb-16 items-start">
            {pillars.map((pillar, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: pillar.delay, type: "spring", stiffness: 100 }}
                className="flex flex-col items-center group min-w-0 w-full"
              >
                <span className="text-paper/40 text-[11px] sm:text-sm mb-4 sm:mb-6 tracking-[0.2em] sm:tracking-widest uppercase text-center">{pillar.label}</span>
                <div className="relative mb-4 sm:mb-6 min-h-[88px] sm:min-h-[140px] flex items-start justify-center">
                  <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="writing-vertical text-[28px] sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-[0.16em] sm:tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-b from-paper via-paper to-paper/50 drop-shadow-sm">
                    {pillar.data.ganzhi}
                  </div>
                </div>
                <div className="flex flex-col items-center space-y-2 sm:space-y-3 w-full border-t border-paper/10 pt-3 sm:pt-4">
                  <div className="text-center">
                    <span className="text-[10px] text-paper/30 block mb-1">藏干</span>
                    <span className="text-[11px] sm:text-sm text-paper/80 leading-5 break-words">{pillar.data.canggan}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-paper/30 block mb-1">神煞</span>
                    <div className="flex flex-wrap justify-center gap-1">
                      {Array.isArray(pillar.data.shensha) ? pillar.data.shensha.map((ss, i) => (
                        <div key={i} className="relative group/tooltip">
                          <span className="text-xs text-gold/80 leading-tight cursor-help border-b border-dashed border-gold/30">{ss.name}</span>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-ink text-paper text-xs rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 shadow-xl border border-gold/20 pointer-events-none">
                            <div className="font-bold text-gold mb-1">{ss.name}</div>
                            <div className="text-paper/80 leading-relaxed">{ss.description}</div>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-ink border-b border-r border-gold/20 transform rotate-45"></div>
                          </div>
                        </div>
                      )) : null}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 五行比例展示 */}
          {(() => {
            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="max-w-3xl mx-auto mb-12">
                <h4 className="text-center text-paper/50 text-xs sm:text-sm tracking-[0.2em] sm:tracking-widest mb-4">五行力量占比</h4>
                <div className="flex h-3 rounded-full overflow-hidden bg-white/5 border border-white/10">
                  {Object.entries(result.wuxingRatio).map(([key, value]) => {
                    const displayValue = value;
                    if (displayValue <= 0) return null;
                    const colorInfo = wuxingColors[key as keyof typeof wuxingColors];
                    return (
                      <div key={key} style={{ width: `${displayValue}%` }} className={`${colorInfo.bg} h-full transition-all duration-1000 group relative`}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink text-paper text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                          {colorInfo.label} {displayValue.toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-3 px-1 sm:flex sm:justify-between sm:px-2">
                  {Object.entries(wuxingColors).map(([key, info]) => {
                    const isXi = result.yongshen?.xi?.includes(info.label);
                    const isJi = result.yongshen?.ji?.includes(info.label);
                    const displayValue = result.wuxingRatio[key as keyof typeof wuxingColors];
                    return (
                      <div key={key} className="flex items-center justify-center sm:justify-start gap-1.5 min-w-0">
                        <div className={`w-2 h-2 rounded-full ${info.bg}`}></div>
                        <span className="text-[11px] sm:text-xs text-paper/60 flex items-center gap-1 whitespace-nowrap">
                          {info.label} {displayValue.toFixed(0)}%
                          {isXi && <span className="text-[8px] bg-red-500 text-white px-1 rounded-sm leading-none py-0.5">喜</span>}
                          {isJi && <span className="text-[8px] bg-gray-600 text-white px-1 rounded-sm leading-none py-0.5">忌</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })()}

          {/* 用神展示区 */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center backdrop-blur-sm">
              <span className="text-gold/70 text-xs tracking-widest mb-1">喜神</span>
              <span className="text-paper font-bold text-lg">{result.yongshen?.xi || '未知'}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center backdrop-blur-sm">
              <span className="text-cinnabar/70 text-xs tracking-widest mb-1">忌神</span>
              <span className="text-paper font-bold text-lg">{result.yongshen?.ji || '未知'}</span>
            </div>
            <div className="bg-gold/10 border border-gold/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center backdrop-blur-sm">
              <span className="text-gold text-xs tracking-widest mb-1">用神格局</span>
              <span className="text-gold font-bold text-lg">{result.yongshen?.yong || '未知'}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 模块：一生总运分析 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/70 border border-[#d5d0c4] shadow-sm rounded-[2rem] p-6 md:p-8 backdrop-blur-md"
      >
        <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-4 text-gold">
          <BookOpen className="w-6 h-6 text-gold" />
          <h4 className="font-bold tracking-widest text-xl text-ink">总运分析</h4>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 border-b border-black/5 pb-4">
          {[
            { id: 'overall', label: '整体命格' },
            { id: 'character', label: '性格特质' },
            { id: 'wuxing', label: '五行喜忌' },
            { id: 'health', label: '健康调候' },
            { id: 'wealth', label: '一生财运' },
            { id: 'career', label: '一生事业' },
            { id: 'emotion', label: '一生情感' },
            { id: 'family', label: '一生家庭' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setOverallTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold tracking-widest transition-all duration-300 ${
                overallTab === tab.id 
                  ? 'bg-ink text-white shadow-md' 
                  : 'bg-white/50 text-ink/60 hover:bg-white/80 hover:text-ink border border-black/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={overallTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-[150px]"
          >
            {renderOverallContent()}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* 大运流年区 (深度批次加载) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-bl from-white/90 to-white/50 border border-cinnabar/20 shadow-lg rounded-[2rem] p-6 md:p-8 backdrop-blur-md min-h-[400px]"
      >
        <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-4 text-cinnabar">
          <Compass className="w-6 h-6" />
          <h4 className="font-bold tracking-widest text-xl text-ink">大运流年 (深入详评)</h4>
        </div>
        {isDayunLoading ? renderStreamPanel('大运推演实时输出', dayunStreamText) : null}
        
        {isDayunLoading && (!dayunList || dayunList.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink/40">
            <Loader2 className="w-10 h-10 animate-spin text-cinnabar mb-4" />
            <p className="tracking-widest font-bold text-sm">正在撰写初始大运流年详评，请稍候...</p>
          </div>
        ) : dayunFetchError && (!dayunList || dayunList.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-16 text-ink/60">
            <p className="text-red-500 mb-4 tracking-widest font-bold">大运流年推演失败，天机受阻</p>
            <button 
              onClick={() => {
                fetchedBirthInfoRef.current = null;
                fetchDayunData();
              }} 
              className="px-6 py-2 bg-cinnabar text-white rounded-full hover:bg-red-700 transition-colors shadow-md"
            >
              重新推演
            </button>
          </div>
        ) : dayunList && Array.isArray(dayunList) ? (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 左侧：大运走势与选择 */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6">
              {/* 走势图 */}
              <div className="w-full bg-white/40 rounded-2xl p-3 sm:p-4 border border-black/5">
                <div className="mb-4 flex flex-col gap-3 sm:mb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-ink/60 text-xs font-bold tracking-widest">
                    <TrendingUp className="w-4 h-4" />
                    <span>大运走势 (0-100分)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 sm:justify-end">
                    <button onClick={() => toggleLine('score')} className={`text-[11px] sm:text-[10px] px-2 py-1 rounded-full border transition-colors ${visibleLines.score ? 'bg-[#c0392b] text-white border-[#c0392b]' : 'bg-transparent text-ink/40 border-ink/20'}`}>综合</button>
                    <button onClick={() => toggleLine('wealthScore')} className={`text-[11px] sm:text-[10px] px-2 py-1 rounded-full border transition-colors ${visibleLines.wealthScore ? 'bg-[#eab308] text-white border-[#eab308]' : 'bg-transparent text-ink/40 border-ink/20'}`}>财运</button>
                    <button onClick={() => toggleLine('emotionScore')} className={`text-[11px] sm:text-[10px] px-2 py-1 rounded-full border transition-colors ${visibleLines.emotionScore ? 'bg-[#ef4444] text-white border-[#ef4444]' : 'bg-transparent text-ink/40 border-ink/20'}`}>情感</button>
                    <button onClick={() => toggleLine('careerScore')} className={`text-[11px] sm:text-[10px] px-2 py-1 rounded-full border transition-colors ${visibleLines.careerScore ? 'bg-[#3b82f6] text-white border-[#3b82f6]' : 'bg-transparent text-ink/40 border-ink/20'}`}>事业</button>
                    <button onClick={() => toggleLine('healthScore')} className={`col-span-2 text-[11px] sm:col-span-1 sm:text-[10px] px-2 py-1 rounded-full border transition-colors ${visibleLines.healthScore ? 'bg-[#10b981] text-white border-[#10b981]' : 'bg-transparent text-ink/40 border-ink/20'}`}>健康</button>
                  </div>
                </div>
                <div className="h-48 sm:h-32 md:h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dayunDataChart} margin={{ top: 5, right: 10, left: -20, bottom: 18 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d5d0c4" opacity={0.5} vertical={false} />
                      <XAxis dataKey="name" stroke="#1a1a1a" opacity={0.5} fontSize={10} tickLine={false} axisLine={false} tickMargin={8} height={30} />
                      <YAxis stroke="#1a1a1a" opacity={0.5} fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#f4f1ea', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.1)', fontSize: '12px' }}
                        labelStyle={{ color: '#c0392b', fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      {visibleLines.score && <Line type="monotone" dataKey="score" name="综合" stroke="#c0392b" strokeWidth={3} dot={{ r: 4, fill: '#c0392b', strokeWidth: 2, stroke: '#f4f1ea' }} activeDot={{ r: 6, strokeWidth: 0 }} />}
                      {visibleLines.wealthScore && <Line type="monotone" dataKey="wealthScore" name="财运" stroke="#eab308" strokeWidth={1.5} dot={false} />}
                      {visibleLines.emotionScore && <Line type="monotone" dataKey="emotionScore" name="情感" stroke="#ef4444" strokeWidth={1.5} dot={false} />}
                      {visibleLines.careerScore && <Line type="monotone" dataKey="careerScore" name="事业" stroke="#3b82f6" strokeWidth={1.5} dot={false} />}
                      {visibleLines.healthScore && <Line type="monotone" dataKey="healthScore" name="健康" stroke="#10b981" strokeWidth={1.5} dot={false} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white/35 p-3 sm:p-4">
                <div className="mb-3 text-xs font-bold tracking-widest text-ink/60">
                  大运年份
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {dayunList.map((phase, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDayun(idx);
                        setSelectedLiunian(null);
                      }}
                      className={`min-w-0 px-2 py-2 rounded-xl text-sm font-bold tracking-widest transition-all duration-300 ${
                        selectedDayun === idx 
                          ? 'bg-cinnabar text-white shadow-md' 
                          : 'bg-white/50 text-ink/60 hover:bg-white/80 hover:text-ink border border-black/5'
                      }`}
                    >
                      {phase.ganzhi}
                    </button>
                  ))}
                  
                  {/* 异步流式加载后续大运的指示器 */}
                  {dayunProgress.current > 0 && dayunProgress.current < dayunProgress.total && !dayunFetchError && (
                    <div className="col-span-4 flex items-center justify-center gap-2 px-3 py-2 bg-white/40 rounded-xl text-ink/50 text-xs animate-pulse border border-black/5 shadow-sm">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      正在推演后续大运 ({dayunProgress.current}/{dayunProgress.total})...
                    </div>
                  )}
                  {dayunProgress.current > 0 && dayunProgress.current < dayunProgress.total && dayunFetchError && (
                    <button 
                      onClick={() => {
                        fetchedBirthInfoRef.current = null;
                        fetchDayunData();
                      }}
                      className="col-span-4 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-500 rounded-xl text-xs border border-red-100 shadow-sm hover:bg-red-100"
                    >
                      后续推演断开，点击重推
                    </button>
                  )}
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                {dayunList[selectedDayun] && (
                  <motion.div 
                    key={selectedDayun}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white/50 border border-black/5 rounded-2xl p-4 sm:p-6"
                  >
                    <div className="mb-4 flex flex-col gap-2 border-b border-black/5 pb-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="text-cinnabar font-bold text-3xl tracking-widest">
                        {dayunList[selectedDayun].ganzhi}
                      </div>
                      <div className="text-ink/40 text-sm font-medium">
                        {dayunList[selectedDayun].period}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 mb-4 sm:grid-cols-5">
                      {[
                        { id: 'wealth', label: '财运', score: dayunList[selectedDayun].wealthScore, color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/20' },
                        { id: 'emotion', label: '情感', score: dayunList[selectedDayun].emotionScore, color: 'text-cinnabar', bg: 'bg-cinnabar/10', border: 'border-cinnabar/20' },
                        { id: 'career', label: '事业', score: dayunList[selectedDayun].careerScore, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                        { id: 'family', label: '家庭', score: dayunList[selectedDayun].familyScore || 'N/A', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                        { id: 'health', label: '健康', score: dayunList[selectedDayun].healthScore, color: 'text-jade', bg: 'bg-jade/10', border: 'border-jade/20' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setDayunTab(tab.id)}
                          className={`p-2 rounded-lg text-center border transition-all duration-300 ${
                            dayunTab === tab.id ? `${tab.bg} ${tab.border} shadow-sm scale-105` : 'bg-white/40 border-black/5 hover:bg-white/60'
                          }`}
                        >
                          <div className={`text-[10px] mb-1 ${dayunTab === tab.id ? tab.color : 'text-ink/40'}`}>{tab.label}</div>
                          <div className={`font-bold ${dayunTab === tab.id ? tab.color : 'text-ink/80'}`}>{tab.score}</div>
                        </button>
                      ))}
                    </div>

                    {/* 选择后的分类详评：置于分类按钮正下方 */}
                    <div className="bg-white/40 p-4 rounded-xl border border-black/5 min-h-[100px] mb-6">
                      {dayunTab === 'wealth' && <div className="text-sm text-ink/80 leading-relaxed">{dayunList[selectedDayun].wealthDescription}</div>}
                      {dayunTab === 'emotion' && <div className="text-sm text-ink/80 leading-relaxed">{dayunList[selectedDayun].emotionDescription}</div>}
                      {dayunTab === 'career' && <div className="text-sm text-ink/80 leading-relaxed">{dayunList[selectedDayun].careerDescription}</div>}
                      {dayunTab === 'family' && <div className="text-sm text-ink/80 leading-relaxed">{dayunList[selectedDayun].familyDescription}</div>}
                      {dayunTab === 'health' && <div className="text-sm text-ink/80 leading-relaxed">{dayunList[selectedDayun].healthDescription}</div>}
                    </div>

                    <div className="space-y-4">
                      <div className="text-sm leading-7">
                        <span className="font-bold text-ink/60 mr-2">【大运综合详评】</span>
                        <span className="text-ink/80 leading-relaxed">{dayunList[selectedDayun].description}</span>
                      </div>
                      <div className="text-sm leading-7">
                        <span className="font-bold text-ink/60 mr-2">【五行喜忌】</span>
                        <span className="text-ink/80 leading-relaxed">{dayunList[selectedDayun].wuxingPreference}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 右侧：流年走势与详情 */}
            <div className="relative w-full lg:w-1/2">
              {fetchingLiunianIndex !== null ? (
                <div className="absolute inset-0 z-10 rounded-2xl bg-[#f4f1ea]/92 backdrop-blur-sm p-3 sm:p-5 overflow-hidden">
                  <div className="flex h-full flex-col">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold tracking-widest text-[#e67e22]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>正在推演此大运流年</span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden">
                    {renderStreamPanel('流年推演实时输出', liunianStreamText, 'cinnabar', 'max-h-[44vh] sm:max-h-[28rem]')}
                  </div>
                  </div>
                </div>
              ) : null}
              <AnimatePresence mode="wait">
                {dayunList[selectedDayun] && dayunList[selectedDayun].liunian && dayunList[selectedDayun].liunian.length > 0 ? (
                  <motion.div 
                    key={`liunian-${selectedDayun}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-4 text-ink/60 text-sm font-bold tracking-widest">
                      <TrendingUp className="w-4 h-4" />
                      <span>流年走势与详情</span>
                    </div>
                    
                    {/* 流年走势图 */}
                    <div className="w-full bg-white/40 rounded-xl p-2 sm:p-3 border border-black/5 mb-4">
                      <div className="mb-4 flex flex-col gap-2 px-1 sm:mb-3 sm:flex-row sm:items-center sm:justify-between sm:px-2">
                        <div className="text-ink/60 text-[10px] font-bold tracking-widest">
                          流年走势
                        </div>
                        <div className="grid grid-cols-3 gap-1 sm:flex sm:flex-wrap">
                          <button onClick={() => toggleLine('score')} className={`text-[10px] sm:text-[8px] px-1.5 py-1 rounded-full border transition-colors ${visibleLines.score ? 'bg-[#c0392b] text-white border-[#c0392b]' : 'bg-transparent text-ink/40 border-ink/20'}`}>综合</button>
                          <button onClick={() => toggleLine('wealthScore')} className={`text-[10px] sm:text-[8px] px-1.5 py-1 rounded-full border transition-colors ${visibleLines.wealthScore ? 'bg-[#eab308] text-white border-[#eab308]' : 'bg-transparent text-ink/40 border-ink/20'}`}>财运</button>
                          <button onClick={() => toggleLine('emotionScore')} className={`text-[10px] sm:text-[8px] px-1.5 py-1 rounded-full border transition-colors ${visibleLines.emotionScore ? 'bg-[#ef4444] text-white border-[#ef4444]' : 'bg-transparent text-ink/40 border-ink/20'}`}>情感</button>
                          <button onClick={() => toggleLine('careerScore')} className={`text-[10px] sm:text-[8px] px-1.5 py-1 rounded-full border transition-colors ${visibleLines.careerScore ? 'bg-[#3b82f6] text-white border-[#3b82f6]' : 'bg-transparent text-ink/40 border-ink/20'}`}>事业</button>
                          <button onClick={() => toggleLine('healthScore')} className={`col-span-2 text-[10px] sm:col-span-1 sm:text-[8px] px-1.5 py-1 rounded-full border transition-colors ${visibleLines.healthScore ? 'bg-[#10b981] text-white border-[#10b981]' : 'bg-transparent text-ink/40 border-ink/20'}`}>健康</button>
                        </div>
                      </div>
                      <div className="h-48 sm:h-28 md:h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dayunList[selectedDayun].liunian} margin={{ top: 5, right: 10, left: -20, bottom: 18 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#d5d0c4" opacity={0.5} vertical={false} />
                            <XAxis dataKey="year" stroke="#1a1a1a" opacity={0.5} fontSize={10} tickLine={false} axisLine={false} tickMargin={8} height={30} />
                            <YAxis stroke="#1a1a1a" opacity={0.5} fontSize={10} domain={[0, 100]} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#f4f1ea', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.1)', fontSize: '12px' }}
                              labelStyle={{ color: '#c0392b', fontWeight: 'bold', marginBottom: '4px' }}
                              labelFormatter={(label) => `${label}年`}
                            />
                            {visibleLines.score && <Line type="monotone" dataKey="score" name="综合" stroke="#e67e22" strokeWidth={2} dot={{ r: 3, fill: '#e67e22', strokeWidth: 1, stroke: '#f4f1ea' }} activeDot={{ r: 5, strokeWidth: 0 }} />}
                            {visibleLines.wealthScore && <Line type="monotone" dataKey="wealthScore" name="财运" stroke="#eab308" strokeWidth={1.5} dot={false} />}
                            {visibleLines.emotionScore && <Line type="monotone" dataKey="emotionScore" name="情感" stroke="#ef4444" strokeWidth={1.5} dot={false} />}
                            {visibleLines.careerScore && <Line type="monotone" dataKey="careerScore" name="事业" stroke="#3b82f6" strokeWidth={1.5} dot={false} />}
                            {visibleLines.healthScore && <Line type="monotone" dataKey="healthScore" name="健康" stroke="#10b981" strokeWidth={1.5} dot={false} />}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* 流年选择 */}
                    <div className="mb-4 rounded-xl border border-black/5 bg-white/35 p-3 sm:p-4">
                      <div className="mb-3 text-[10px] font-bold tracking-widest text-ink/60 sm:text-xs">
                        流年年份
                      </div>
                      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                        {dayunList[selectedDayun].liunian.map((ln, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedLiunian(idx)}
                            className={`min-h-[76px] min-w-0 px-1 py-2 rounded-lg text-xs sm:text-sm font-bold tracking-widest transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                              selectedLiunian === idx 
                                ? 'bg-[#e67e22] text-white shadow-sm' 
                                : 'bg-white/60 text-ink/60 hover:bg-white hover:text-ink border border-black/5'
                            }`}
                          >
                            <span className="leading-none">{ln.year}</span>
                            <span className={`text-[10px] leading-none mb-0.5 ${selectedLiunian === idx ? 'text-white/60' : 'text-ink/40'}`}>{ln.age}岁</span>
                            <span className={`leading-none text-[11px] sm:text-sm ${selectedLiunian === idx ? 'text-white/90' : 'text-ink/50'}`}>{ln.ganzhi}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 流年详情 */}
                    <AnimatePresence mode="wait">
                      {selectedLiunian !== null && dayunList[selectedDayun].liunian[selectedLiunian] ? (
                        <motion.div
                          key={selectedLiunian}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="bg-white/60 border border-[#e67e22]/20 rounded-xl p-4 flex-1 overflow-hidden"
                        >
                          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span className="font-bold text-[#e67e22] text-base sm:text-lg leading-7">
                              {dayunList[selectedDayun].liunian[selectedLiunian].year}年 ({dayunList[selectedDayun].liunian[selectedLiunian].age}岁) - {dayunList[selectedDayun].liunian[selectedLiunian].ganzhi}
                            </span>
                            <span className="w-fit text-sm font-bold bg-[#e67e22]/10 text-[#e67e22] px-2 py-1 rounded-full">综合: {dayunList[selectedDayun].liunian[selectedLiunian].score}</span>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-1.5 mb-4 sm:grid-cols-5">
                            {[
                              { id: 'wealth', label: '财运', score: dayunList[selectedDayun].liunian[selectedLiunian].wealthScore, color: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/20' },
                              { id: 'emotion', label: '情感', score: dayunList[selectedDayun].liunian[selectedLiunian].emotionScore, color: 'text-cinnabar', bg: 'bg-cinnabar/10', border: 'border-cinnabar/20' },
                              { id: 'career', label: '事业', score: dayunList[selectedDayun].liunian[selectedLiunian].careerScore, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                              { id: 'family', label: '家庭', score: dayunList[selectedDayun].liunian[selectedLiunian].familyScore || 'N/A', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                              { id: 'health', label: '健康', score: dayunList[selectedDayun].liunian[selectedLiunian].healthScore, color: 'text-jade', bg: 'bg-jade/10', border: 'border-jade/20' }
                            ].map(tab => (
                              <button
                                key={tab.id}
                                onClick={() => setLiunianTab(tab.id)}
                                className={`p-1.5 rounded-lg text-center border transition-all duration-300 ${
                                  liunianTab === tab.id ? `${tab.bg} ${tab.border} shadow-sm scale-105` : 'bg-white/40 border-black/5 hover:bg-white/60'
                                }`}
                              >
                                <div className={`text-[10px] mb-0.5 ${liunianTab === tab.id ? tab.color : 'text-ink/40'}`}>{tab.label}</div>
                                <div className={`font-bold text-sm ${liunianTab === tab.id ? tab.color : 'text-ink/80'}`}>{tab.score}</div>
                              </button>
                            ))}
                          </div>

                          {/* 选择后的分类详评：置于分类按钮正下方 */}
                          <div className="bg-white/40 p-3 rounded-xl border border-black/5 min-h-[80px] mb-4">
                            {liunianTab === 'wealth' && <div className="text-sm text-ink/80 leading-relaxed">{dayunList[selectedDayun].liunian[selectedLiunian].wealthDescription}</div>}
                            {liunianTab === 'emotion' && <div className="text-sm text-ink/80 leading-relaxed">{dayunList[selectedDayun].liunian[selectedLiunian].emotionDescription}</div>}
                            {liunianTab === 'career' && <div className="text-sm text-ink/80 leading-relaxed">{dayunList[selectedDayun].liunian[selectedLiunian].careerDescription}</div>}
                            {liunianTab === 'family' && <div className="text-sm text-ink/80 leading-relaxed">{dayunList[selectedDayun].liunian[selectedLiunian].familyDescription}</div>}
                            {liunianTab === 'health' && <div className="text-sm text-ink/80 leading-relaxed">{dayunList[selectedDayun].liunian[selectedLiunian].healthDescription}</div>}
                          </div>

                          <div className="space-y-3">
                            <div className="text-sm leading-7">
                              <span className="font-bold text-ink/60 mr-2">【流年综合详评】</span>
                              <span className="text-ink/80 leading-relaxed">{dayunList[selectedDayun].liunian[selectedLiunian].description}</span>
                            </div>
                            <div className="text-sm leading-7">
                              <span className="font-bold text-ink/60 mr-2">【五行喜忌】</span>
                              <span className="text-ink/80 leading-relaxed">{dayunList[selectedDayun].liunian[selectedLiunian].wuxingPreference}</span>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="empty-liunian"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex flex-col items-center justify-center flex-1 text-ink/30 border border-dashed border-black/10 rounded-xl p-4 min-h-[100px]"
                        >
                          <CalendarIcon className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-sm">点击上方年份查看流年详评</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : dayunList[selectedDayun] ? (
                  <motion.div 
                    key={`liunian-empty-${selectedDayun}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col items-center justify-center border border-dashed border-black/10 rounded-xl p-8 text-center bg-white/30 min-h-[300px] overflow-hidden"
                  >
                    <CalendarIcon className="w-12 h-12 mb-4 text-ink/20" />
                    <h4 className="text-lg font-bold text-ink/80 mb-2">未推演此大运流年</h4>
                    <p className="text-sm text-ink/50 mb-6 max-w-xs">
                      为提升初始排盘速度，流年运势需手动触发推演。
                    </p>
                    <button
                      onClick={() => fetchSingleDayunLiunian(selectedDayun)}
                      disabled={fetchingLiunianIndex !== null}
                      className="bg-ink text-paper px-6 py-2.5 rounded-full text-sm font-bold tracking-widest hover:bg-ink/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {fetchingLiunianIndex === selectedDayun ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          正在推演...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          推演此大运流年
                        </>
                      )}
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        ) : null}
      </motion.div>

      {/* 运势推演区 */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-white/60 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-[#d5d0c4] shadow-sm"
      >
        <div className="flex items-center gap-3 mb-8 border-b border-black/5 pb-4 text-jade">
          <CalendarIcon className="w-6 h-6" />
          <h4 className="font-bold tracking-widest text-xl text-ink">运势推演</h4>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-full md:w-1/3 space-y-4">
            <p className="text-sm text-ink/60">选择一个日期，推演该日的大运、流年、流月、流日及具体运势。</p>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 border border-[#d5d0c4] rounded-xl focus:outline-none focus:ring-2 focus:ring-jade/50 transition-all font-sans"
            />
            <button
              onClick={fetchFortune}
              disabled={isLoadingFortune}
              className="w-full py-3 bg-ink text-paper rounded-xl font-bold tracking-widest hover:bg-ink/90 transition-all disabled:opacity-50 flex justify-center items-center"
            >
              {isLoadingFortune ? <Loader2 className="w-5 h-5 animate-spin" /> : '推演运势'}
            </button>
            {fortuneError && <p className="text-red-500 text-sm mt-2">{fortuneError}</p>}
          </div>

          <div className="w-full md:w-2/3 min-h-[200px] bg-white/40 rounded-2xl p-6 border border-white/40">
            {isLoadingFortune ? (
              <div className="mb-4">
                {renderStreamPanel('每日运势实时输出', dailyStreamText, 'jade')}
              </div>
            ) : null}
            <AnimatePresence mode="wait">
              {isLoadingFortune ? (
                <motion.div key="loading" exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full text-ink/40 py-8">
                  <Loader2 className="w-8 h-8 animate-spin mb-4 text-jade" />
                  <p className="tracking-widest text-sm">推演中...</p>
                </motion.div>
              ) : dailyFortune ? (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                    <div className="bg-white/60 p-2.5 sm:p-2 rounded-lg border border-black/5">
                      <span className="block text-[10px] sm:text-[10px] text-ink/40 mb-1 tracking-[0.2em] sm:tracking-normal">大运</span>
                      <span className="block font-bold text-ink text-sm sm:text-base leading-6 break-words">{dailyFortune.period.dayun}</span>
                    </div>
                    <div className="bg-white/60 p-2.5 sm:p-2 rounded-lg border border-black/5">
                      <span className="block text-[10px] sm:text-[10px] text-ink/40 mb-1 tracking-[0.2em] sm:tracking-normal">流年</span>
                      <span className="block font-bold text-ink text-sm sm:text-base leading-6 break-words">{dailyFortune.period.liunian}</span>
                    </div>
                    <div className="bg-white/60 p-2.5 sm:p-2 rounded-lg border border-black/5">
                      <span className="block text-[10px] sm:text-[10px] text-ink/40 mb-1 tracking-[0.2em] sm:tracking-normal">流月</span>
                      <span className="block font-bold text-ink text-sm sm:text-base leading-6 break-words">{dailyFortune.period.liuyue}</span>
                    </div>
                    <div className="bg-white/60 p-2.5 sm:p-2 rounded-lg border border-black/5 col-span-2 sm:col-span-1">
                      <span className="block text-[10px] text-ink/40 mb-1 tracking-[0.28em] sm:tracking-normal">流日</span>
                      <span className="block font-bold text-ink text-sm sm:text-base leading-6 break-all sm:break-words">{dailyFortune.period.liuri}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="font-bold text-ink">运势评分</span>
                        <span className="shrink-0 text-jade font-bold">{dailyFortune.score}</span>
                      </div>
                      <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-jade rounded-full transition-all duration-1000"
                          style={{ width: `${dailyFortune.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <p className="text-ink/80 leading-7 font-sans text-sm bg-white/50 p-4 sm:p-5 rounded-xl">
                    {dailyFortune.summary}
                  </p>

                  {dailyFortune.shensha && dailyFortune.shensha.length > 0 ? (
                    <div className="bg-white/50 p-4 sm:p-5 rounded-xl border border-black/5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-bold tracking-widest text-ink/70">
                        <BookOpen className="w-4 h-4 text-jade" />
                        <span>流日神煞（黄历辅助）</span>
                      </div>
                      <div className="flex flex-wrap gap-2.5 mb-4">
                        {dailyFortune.shensha.map((item) => (
                          <span
                            key={item.name}
                            className="px-3 py-1.5 rounded-full bg-jade/10 text-jade text-xs font-bold border border-jade/20 leading-none"
                          >
                            {item.name}
                          </span>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {dailyFortune.shensha.map((item) => (
                          <div key={`${item.name}-desc`} className="text-sm text-ink/70 leading-7">
                            <span className="font-bold text-ink mr-2">{item.name}</span>
                            <span>{item.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div className="bg-green-50/50 border border-green-200/50 p-3.5 sm:p-3 rounded-xl flex gap-3 items-start">
                      <div className="w-6 h-6 shrink-0 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">宜</div>
                      <p className="text-sm text-green-800 font-sans leading-7">{dailyFortune.auspicious}</p>
                    </div>
                    <div className="bg-red-50/50 border border-red-200/50 p-3.5 sm:p-3 rounded-xl flex gap-3 items-start">
                      <div className="w-6 h-6 shrink-0 bg-red-100 text-red-700 rounded-full flex items-center justify-center font-bold text-xs mt-0.5">忌</div>
                      <p className="text-sm text-red-800 font-sans leading-7">{dailyFortune.inauspicious}</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" className="flex flex-col items-center justify-center h-full text-ink/30 py-8">
                  <CalendarIcon className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-sm">选择日期并点击推演，查看详细运势</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{ position: 'fixed', left: '-10000px', top: 0, width: '1120px' }}
      >
        <div
          id={SHARE_CARD_ID}
          className="bg-[#f4f1ea] text-[#1f2937] p-10"
          style={{ width: '1120px' }}
        >
          <div className="rounded-[32px] border border-[#d5d0c4] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)] overflow-hidden">
            <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_30%),linear-gradient(135deg,#111827_0%,#0f1115_52%,#17130f_100%)] text-[#f8f4ec] px-12 py-10">
              <div className="absolute inset-0 opacity-[0.06] flex items-center justify-center text-[32rem] font-bold leading-none pointer-events-none select-none">
                命
              </div>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4af37]/50 to-transparent" />
              <div className="relative z-10">
                <div className="flex flex-col items-center text-center">
                  <div className="inline-flex items-center gap-4 text-[#d4af37] text-[15px] tracking-[0.45em]">
                    <span>✧</span>
                    <span>四柱八字</span>
                    <span>✧</span>
                  </div>
                  <div className="mt-5 w-[280px] h-px bg-gradient-to-r from-transparent via-[#d4af37]/35 to-transparent" />
                  <div className="mt-5 text-[15px] tracking-[0.08em] text-white/68">
                    {birthInfo.gender}命 · {birthInfo.calendarType === 'lunar' ? '农历' : '公历'} {birthInfo.birthDate.replace(/-/g, '/')} {birthInfo.birthTime}
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-4 gap-10">
                  {pillars.map((pillar) => (
                    <div key={`share-${pillar.label}`} className="text-center">
                      <div className="text-white/55 text-[15px] tracking-[0.22em] mb-8">{pillar.label}</div>
                      <div className="min-h-[170px] flex flex-col items-center justify-start gap-2">
                        {pillar.data.ganzhi.split('').map((char, idx) => (
                          <div
                            key={`${pillar.label}-char-${idx}`}
                            className="text-[76px] leading-none font-semibold text-[#f5f1e8] drop-shadow-[0_10px_30px_rgba(255,255,255,0.06)]"
                          >
                            {char}
                          </div>
                        ))}
                      </div>
                      <div className="mt-10 pt-5 border-t border-white/10 space-y-4">
                        <div>
                          <div className="text-[12px] tracking-[0.2em] text-white/28 mb-2">藏干</div>
                          <div className="text-[14px] text-white/82 tracking-[0.08em]">{pillar.data.canggan || '-'}</div>
                        </div>
                        <div>
                          <div className="text-[12px] tracking-[0.2em] text-white/28 mb-2">神煞</div>
                          <div className="text-[13px] leading-7 text-[#d4af37]">
                            {pillar.data.shensha.length > 0
                              ? pillar.data.shensha.map((item) => item.name).join(' ')
                              : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-14">
                  <div className="text-center text-white/58 text-[15px] tracking-[0.2em] mb-5">五行力量占比</div>
                  <div className="h-3 rounded-full overflow-hidden bg-white/8 border border-white/10 flex">
                    {Object.entries(result.wuxingRatio).map(([key, value]) => {
                      const displayValue = value;
                      if (displayValue <= 0) return null;
                      const colorInfo = wuxingColors[key as keyof typeof wuxingColors];
                      return (
                        <div
                          key={`share-bar-${key}`}
                          className={`${colorInfo.bg} h-full`}
                          style={{ width: `${displayValue}%` }}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-4 grid grid-cols-5 gap-3">
                    {Object.entries(wuxingColors).map(([key, info]) => {
                      const displayValue = result.wuxingRatio[key as keyof typeof wuxingColors];
                      const isXi = result.yongshen?.xi?.includes(info.label);
                      const isJi = result.yongshen?.ji?.includes(info.label);
                      return (
                        <div key={`share-wuxing-${key}`} className="flex items-center justify-center gap-2 text-[14px] text-white/74">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${info.bg}`} />
                          <span>{info.label}{displayValue.toFixed(0)}%</span>
                          {isXi ? <span className="px-1.5 py-0.5 rounded bg-[#ef4444] text-white text-[10px] leading-none">喜</span> : null}
                          {isJi ? <span className="px-1.5 py-0.5 rounded bg-white/16 text-white/82 text-[10px] leading-none">忌</span> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-3 gap-4">
                  {[
                    { title: '喜神', content: result.yongshen?.xi || '-' },
                    { title: '忌神', content: result.yongshen?.ji || '-' },
                    { title: '用神格局', content: result.yongshen?.yong || '-' },
                  ].map((section, index) => (
                    <div
                      key={`yongshen-card-${section.title}`}
                      className={`rounded-[22px] border px-6 py-6 min-h-[138px] flex flex-col justify-start ${
                        index === 2
                          ? 'border-[#d4af37]/30 bg-[linear-gradient(180deg,rgba(212,175,55,0.09),rgba(212,175,55,0.04))]'
                          : 'border-white/10 bg-white/6'
                      }`}
                    >
                      <div className={`${index === 1 ? 'text-[#ef8c7a]' : 'text-[#d4af37]'} text-[14px] tracking-[0.2em] mb-4 text-center`}>
                        {section.title}
                      </div>
                      <div className={`text-center text-[17px] leading-9 font-semibold ${index === 2 ? 'text-[#f3d37a]' : 'text-[#f5f1e8]'}`}>
                        {section.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-10 py-8 space-y-8">
              <div className="grid grid-cols-2 gap-5">
                {summarySections.map((section) => (
                  <div key={section.id} className="rounded-[24px] border border-[#e5ded1] bg-white p-6">
                    <div className="text-xs uppercase tracking-[0.3em] text-[#8a7358] mb-3">{section.title}</div>
                    <div className="text-[15px] leading-8 text-[#374151] whitespace-pre-wrap">{section.content}</div>
                  </div>
                ))}
              </div>

              {dayunList && dayunList.length > 0 ? (
                <div className="grid grid-cols-2 gap-5">
                  <div className="min-w-0 rounded-[28px] border border-[#e5ded1] bg-white p-6 overflow-hidden">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="text-xs tracking-[0.35em] text-[#8a7358] mb-2">总大运走势</div>
                        <div className="text-lg font-bold text-[#1f2937]">八步大运综合起伏</div>
                      </div>
                    </div>
                    <div className="h-[260px] overflow-hidden rounded-[22px] border border-[#efe6d7] bg-[linear-gradient(180deg,#fffdf8_0%,#f8f3ea_100%)] px-3 pt-4 pb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dayunDataChart} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
                          <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis width={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#fffdf8', borderRadius: '14px', border: '1px solid rgba(213,208,196,0.9)', fontSize: '12px' }}
                            labelStyle={{ color: '#9a3412', fontWeight: 'bold', marginBottom: '4px' }}
                            formatter={(value: number, name: string) => [`${value}`, name]}
                          />
                          {visibleLines.score && <Line type="monotone" dataKey="score" name="综合" stroke="#d97706" strokeWidth={2.5} dot={{ r: 3, fill: '#d97706', strokeWidth: 1, stroke: '#fffdf8' }} activeDot={{ r: 5, strokeWidth: 0 }} />}
                          {visibleLines.wealthScore && <Line type="monotone" dataKey="wealthScore" name="财运" stroke="#eab308" strokeWidth={1.7} dot={false} />}
                          {visibleLines.emotionScore && <Line type="monotone" dataKey="emotionScore" name="情感" stroke="#ef4444" strokeWidth={1.7} dot={false} />}
                          {visibleLines.careerScore && <Line type="monotone" dataKey="careerScore" name="事业" stroke="#3b82f6" strokeWidth={1.7} dot={false} />}
                          {visibleLines.healthScore && <Line type="monotone" dataKey="healthScore" name="健康" stroke="#10b981" strokeWidth={1.7} dot={false} />}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="min-w-0 rounded-[28px] border border-[#e5ded1] bg-white p-6 overflow-hidden">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="min-w-0">
                        <div className="text-xs tracking-[0.35em] text-[#8a7358] mb-2">当前大运流年走势</div>
                        <div className="text-lg font-bold text-[#1f2937] break-all">
                          {selectedDayunPhase ? `${selectedDayunPhase.ganzhi} 流年起伏` : '当前大运流年起伏'}
                        </div>
                      </div>
                      {selectedDayunPhase ? (
                        <div className="shrink-0 rounded-full border border-[#f1d6c8] bg-[#fff8f4] px-4 py-2 text-sm font-semibold text-[#9a3412]">
                          {selectedDayunPhase.period}
                        </div>
                      ) : null}
                    </div>
                    <div className="h-[260px] overflow-hidden rounded-[22px] border border-[#efe6d7] bg-[linear-gradient(180deg,#fffdf8_0%,#f8f3ea_100%)] px-3 pt-4 pb-2">
                      {selectedDayunPhase?.liunian && selectedDayunPhase.liunian.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={selectedDayunPhase.liunian} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
                            <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis width={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fffdf8', borderRadius: '14px', border: '1px solid rgba(213,208,196,0.9)', fontSize: '12px' }}
                              labelStyle={{ color: '#c2410c', fontWeight: 'bold', marginBottom: '4px' }}
                              labelFormatter={(label) => `${label}年`}
                              formatter={(value: number, name: string) => [`${value}`, name]}
                            />
                            {visibleLines.score && <Line type="monotone" dataKey="score" name="综合" stroke="#ea580c" strokeWidth={2.5} dot={{ r: 3, fill: '#ea580c', strokeWidth: 1, stroke: '#fffdf8' }} activeDot={{ r: 5, strokeWidth: 0 }} />}
                            {visibleLines.wealthScore && <Line type="monotone" dataKey="wealthScore" name="财运" stroke="#eab308" strokeWidth={1.7} dot={false} />}
                            {visibleLines.emotionScore && <Line type="monotone" dataKey="emotionScore" name="情感" stroke="#ef4444" strokeWidth={1.7} dot={false} />}
                            {visibleLines.careerScore && <Line type="monotone" dataKey="careerScore" name="事业" stroke="#3b82f6" strokeWidth={1.7} dot={false} />}
                            {visibleLines.healthScore && <Line type="monotone" dataKey="healthScore" name="健康" stroke="#10b981" strokeWidth={1.7} dot={false} />}
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center rounded-[20px] border border-dashed border-[#e5ded1] bg-[#fbf8f3] text-sm text-[#8a7358]">
                          当前大运尚未生成流年走势图
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              {selectedDayunPhase ? (
                <div className="rounded-[28px] border border-[#f1d6c8] bg-[#fff8f4] p-6">
                  <div className="flex items-start justify-between gap-6 mb-4">
                    <div>
                      <div className="text-xs tracking-[0.35em] text-[#b45309] mb-2">当前大运</div>
                      <div className="text-2xl font-bold text-[#9a3412]">{selectedDayunPhase.ganzhi}</div>
                      <div className="text-sm text-[#9a3412]/70 mt-1">{selectedDayunPhase.period}</div>
                    </div>
                    <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#9a3412] border border-[#f1d6c8]">
                      评分 {selectedDayunPhase.score}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5 text-[15px] leading-8 text-[#7c2d12]">
                    <div>{selectedDayunPhase.description}</div>
                    <div>{selectedDayunPhase.wuxingPreference}</div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    {buildScoreSections(selectedDayunPhase).map((item) => (
                      <div key={`share-dayun-${item.id}`} className="rounded-[22px] border border-[#f3dccf] bg-white/80 p-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className={`text-sm font-semibold tracking-[0.2em] ${item.accent}`}>{item.label}</div>
                          <div className={`rounded-full border px-3 py-1 text-sm font-bold ${item.accent} ${item.chip}`}>
                            {item.score}
                          </div>
                        </div>
                        <div className="text-[14px] leading-7 text-[#7c2d12]">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedLiunianItem ? (
                <div className="rounded-[28px] border border-[#fde1cf] bg-[#fffaf6] p-6">
                  <div className="flex items-start justify-between gap-6 mb-4">
                    <div>
                      <div className="text-xs tracking-[0.35em] text-[#c2410c] mb-2">所选流年</div>
                      <div className="text-2xl font-bold text-[#c2410c]">
                        {selectedLiunianItem.year} / {selectedLiunianItem.ganzhi}
                      </div>
                      <div className="text-sm text-[#c2410c]/70 mt-1">{selectedLiunianItem.age}岁</div>
                    </div>
                    <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#c2410c] border border-[#fde1cf]">
                      评分 {selectedLiunianItem.score}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5 text-[15px] leading-8 text-[#7c2d12]">
                    <div>{selectedLiunianItem.description}</div>
                    <div>{selectedLiunianItem.wuxingPreference}</div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    {buildScoreSections(selectedLiunianItem).map((item) => (
                      <div key={`share-liunian-${item.id}`} className="rounded-[22px] border border-[#f6ddcf] bg-white/85 p-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className={`text-sm font-semibold tracking-[0.2em] ${item.accent}`}>{item.label}</div>
                          <div className={`rounded-full border px-3 py-1 text-sm font-bold ${item.accent} ${item.chip}`}>
                            {item.score}
                          </div>
                        </div>
                        <div className="text-[14px] leading-7 text-[#7c2d12]">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {dailyFortune ? (
                <div className="rounded-[28px] border border-[#cfe7dd] bg-[#f6fbf8] p-6">
                  <div className="flex items-start justify-between gap-6 mb-5">
                    <div>
                      <div className="text-xs tracking-[0.35em] text-[#0f766e] mb-2">流日运势</div>
                      <div className="text-sm text-[#0f766e]/80">
                        {dailyFortune.period.dayun} / {dailyFortune.period.liunian} / {dailyFortune.period.liuyue} / {dailyFortune.period.liuri}
                      </div>
                    </div>
                    <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0f766e] border border-[#cfe7dd]">
                      评分 {dailyFortune.score}
                    </div>
                  </div>
                  <div className="grid grid-cols-[1.3fr_0.7fr] gap-5">
                    <div className="space-y-4">
                      <div className="text-[15px] leading-8 text-[#25534d]">{dailyFortune.summary}</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="rounded-[20px] bg-white p-4 border border-[#d8eee5]">
                          <div className="text-xs tracking-[0.3em] text-[#0f766e] mb-2">宜</div>
                          <div className="leading-7 text-[#25534d]">{dailyFortune.auspicious}</div>
                        </div>
                        <div className="rounded-[20px] bg-white p-4 border border-[#d8eee5]">
                          <div className="text-xs tracking-[0.3em] text-[#0f766e] mb-2">忌</div>
                          <div className="leading-7 text-[#25534d]">{dailyFortune.inauspicious}</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-[20px] bg-white p-4 border border-[#d8eee5]">
                      <div className="text-xs tracking-[0.3em] text-[#0f766e] mb-3">流日神煞</div>
                      <div className="space-y-3">
                        {dailyFortune.shensha?.length ? (
                          dailyFortune.shensha.map((item) => (
                            <div key={item.name}>
                              <div className="text-sm font-semibold text-[#0f766e] mb-1">{item.name}</div>
                              <div className="text-sm leading-7 text-[#25534d]">{item.description}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-[#6b7280]">-</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-12" data-html2canvas-ignore>
        <button
          onClick={onReset}
          className="px-8 py-4 bg-ink text-paper rounded-full hover:bg-ink/90 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 tracking-[0.2em] font-bold text-base"
        >
          重新排盘
        </button>
        <button
          onClick={handleShare}
          disabled={isGeneratingImage}
          className="px-8 py-4 bg-white/80 text-ink border border-black/10 rounded-full hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 tracking-[0.2em] font-bold text-base flex items-center gap-2 disabled:opacity-50"
        >
          {isGeneratingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          保存图片
        </button>
      </div>
    </motion.div>
  );
}

function ResultSection({ title, icon, content }: { title: string; icon: React.ReactNode; content: string }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 mb-3 text-ink/60 hidden">
        {icon}
        <h5 className="font-bold tracking-widest">{title}</h5>
      </div>
      <div className="text-ink/80 leading-loose font-sans whitespace-pre-wrap text-sm md:text-base bg-white/40 p-5 rounded-2xl border border-black/5">
        {content || "推演中，或无相关数据。"}
      </div>
    </div>
  );
}
