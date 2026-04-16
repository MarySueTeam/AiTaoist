import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CompatibilityResult as ICompatibilityResult } from '../services/fortuneService';
import { Heart, RefreshCw, Share2, Sparkles, Activity, Compass, Users, Wind } from 'lucide-react';
import { shareAsImage } from '../utils/shareUtils';
import type { ToneMode } from '../types/toneMode';
import {
  COMPATIBILITY_RESULT_TITLES,
  DEFAULT_COMPATIBILITY_RELATIONSHIP,
  getCompatibilityRelationshipLabel,
  type CompatibilityRelationship,
} from '../services/compatibilityRelationship';
import { buildFourPillarsFromBirthInfo, type FourPillarDisplay } from '../utils/displayUtils';

interface CompatibilityResultProps {
  result: ICompatibilityResult;
  compatibilityInfo: { gender1: string; birthDate1: string; birthTime1: string; calendarType1?: string; isLeapMonth1?: boolean; gender2: string; birthDate2: string; birthTime2: string; calendarType2?: string; isLeapMonth2?: boolean; relationship?: CompatibilityRelationship; toneMode?: ToneMode; isHarshMode: boolean };
  onReset: () => void;
}

export default function CompatibilityResult({ result, compatibilityInfo, onReset }: CompatibilityResultProps) {
  const SHARE_CARD_ID = 'compatibility-share-card';
  const resultRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const relationship = compatibilityInfo.relationship || DEFAULT_COMPATIBILITY_RELATIONSHIP;
  const relationshipLabel = getCompatibilityRelationshipLabel(relationship);
  const resultTitles = COMPATIBILITY_RESULT_TITLES[relationship];
  const person1Pillars = buildFourPillarsFromBirthInfo(compatibilityInfo.birthDate1, compatibilityInfo.birthTime1);
  const person2Pillars = buildFourPillarsFromBirthInfo(compatibilityInfo.birthDate2, compatibilityInfo.birthTime2);

  const handleShare = async () => {
    setIsGeneratingImage(true);
    try {
      await shareAsImage(SHARE_CARD_ID, `compatibility_result_${new Date().getTime()}.png`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const ResultSection = ({ icon, title, content }: { icon: React.ReactNode, title: string, content: string }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 border border-ink/5 hover:bg-white/80 transition-all duration-500 shadow-sm"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-ink/5 flex items-center justify-center text-ink">
          {icon}
        </div>
        <h4 className="text-xl font-bold text-ink tracking-widest">{title}</h4>
      </div>
      <div className="prose prose-ink max-w-none">
        {content.split('\n').map((paragraph, idx) => (
          <p key={idx} className="text-ink/80 leading-relaxed text-justify mb-4 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      ref={resultRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto space-y-12 pb-12 px-4 md:px-0"
    >
      {/* 核心展示区 */}
      <div className="relative bg-ink text-paper rounded-[2.5rem] p-8 md:p-16 shadow-2xl overflow-hidden border border-gold/20">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-gold/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-cinnabar/5 rounded-full blur-[80px] -ml-20 -mb-20 pointer-events-none"></div>
        
        <Heart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] text-paper/[0.02] pointer-events-none" />

        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h3 className="inline-flex items-center gap-3 text-gold text-2xl tracking-[0.5em] font-light border-b border-gold/20 pb-4 px-8">
              <Sparkles className="w-5 h-5" />
              八字合盘
              <Sparkles className="w-5 h-5" />
            </h3>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_160px_1fr] gap-8 md:gap-10 mb-16 items-start">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
              <PillarPanel
                title="主测人八字"
                pillars={person1Pillars}
                meta={`${compatibilityInfo.gender1}命 · ${compatibilityInfo.calendarType1 === 'lunar' ? `农历 ${compatibilityInfo.birthDate1.split('-')[0]}年${compatibilityInfo.isLeapMonth1 ? '闰' : ''}${compatibilityInfo.birthDate1.split('-')[1]}月${compatibilityInfo.birthDate1.split('-')[2]}日` : `公历 ${compatibilityInfo.birthDate1.replace(/-/g, '/')}`} ${compatibilityInfo.birthTime1}`}
              />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative w-32 h-32 flex items-center justify-center mx-auto mt-4 lg:mt-24"
            >
              <div className="absolute inset-0 border-4 border-gold/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
              <div className="absolute inset-2 border-2 border-dashed border-cinnabar/30 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gold">{result.overallScore}</div>
                <div className="text-xs text-gold/60 tracking-widest mt-1">{resultTitles.scoreLabel}</div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
              <PillarPanel
                title="合测人八字"
                pillars={person2Pillars}
                meta={`${compatibilityInfo.gender2}命 · ${compatibilityInfo.calendarType2 === 'lunar' ? `农历 ${compatibilityInfo.birthDate2.split('-')[0]}年${compatibilityInfo.isLeapMonth2 ? '闰' : ''}${compatibilityInfo.birthDate2.split('-')[1]}月${compatibilityInfo.birthDate2.split('-')[2]}日` : `公历 ${compatibilityInfo.birthDate2.replace(/-/g, '/')}`} ${compatibilityInfo.birthTime2}`}
              />
            </motion.div>
          </div>
          <div className="text-center text-gold/70 text-sm tracking-[0.3em]">
            关系类型 · {relationshipLabel}
          </div>
        </div>
      </div>

      {/* 详细分析区 */}
      <div className="space-y-6">
        <ResultSection icon={<Heart />} title={resultTitles.emotionAnalysis} content={result.emotionAnalysis} />
        <ResultSection icon={<Users />} title={resultTitles.interactionPattern} content={result.interactionPattern} />
        <ResultSection icon={<Compass />} title={resultTitles.futureDirection} content={result.futureDirection} />
        <ResultSection icon={<Wind />} title={resultTitles.suggestions} content={result.suggestions} />
      </div>

      {/* 底部操作区 */}
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
            <div className="bg-[#1f2937] text-[#f8f4ec] px-10 py-8">
              <div className="text-xs tracking-[0.45em] text-[#d4af37] mb-3">八字合盘 · {relationshipLabel}</div>
              <div className="grid grid-cols-[1fr_220px_1fr] gap-8 items-center">
                <div className="space-y-3">
                  <div className="text-sm text-white/60 tracking-[0.28em]">主测八字</div>
                  <div className="grid grid-cols-4 gap-2">
                    {person1Pillars.map((pillar) => (
                      <div key={`share-left-${pillar.label}`} className="rounded-[18px] bg-white/10 px-3 py-4 text-center">
                        <div className="text-[11px] text-white/45 mb-2 tracking-[0.2em]">{pillar.label}</div>
                        <div className="text-2xl font-bold leading-tight">{pillar.tiangan}</div>
                        <div className="text-2xl font-bold leading-tight text-white/82">{pillar.dizhi}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-white/70">
                    {compatibilityInfo.gender1} · {compatibilityInfo.birthDate1} {compatibilityInfo.birthTime1}
                  </div>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-7 text-center">
                  <div className="text-xs tracking-[0.3em] text-[#d4af37] mb-2">{resultTitles.scoreLabel}</div>
                  <div className="text-5xl font-bold text-[#f4d58d]">{result.overallScore}</div>
                </div>
                <div className="space-y-3 text-right">
                  <div className="text-sm text-white/60 tracking-[0.28em]">合测八字</div>
                  <div className="grid grid-cols-4 gap-2">
                    {person2Pillars.map((pillar) => (
                      <div key={`share-right-${pillar.label}`} className="rounded-[18px] bg-white/10 px-3 py-4 text-center">
                        <div className="text-[11px] text-white/45 mb-2 tracking-[0.2em]">{pillar.label}</div>
                        <div className="text-2xl font-bold leading-tight">{pillar.tiangan}</div>
                        <div className="text-2xl font-bold leading-tight text-white/82">{pillar.dizhi}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-white/70">
                    {compatibilityInfo.gender2} · {compatibilityInfo.birthDate2} {compatibilityInfo.birthTime2}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-10 py-8 grid grid-cols-2 gap-5">
              {[
                { title: resultTitles.emotionAnalysis, content: result.emotionAnalysis },
                { title: resultTitles.interactionPattern, content: result.interactionPattern },
                { title: resultTitles.futureDirection, content: result.futureDirection },
                { title: resultTitles.suggestions, content: result.suggestions },
              ].map((section) => (
                <div key={section.title} className="rounded-[24px] border border-[#e5ded1] bg-[#fbf8f3] p-6">
                  <div className="text-xs tracking-[0.3em] text-[#8a7358] mb-3">{section.title}</div>
                  <div className="text-[15px] leading-8 text-[#374151] whitespace-pre-wrap">{section.content}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8 border-t border-ink/10">
        <button
          onClick={onReset}
          className="px-8 py-4 rounded-2xl border border-ink/20 text-ink font-bold tracking-widest hover:bg-ink hover:text-paper transition-all flex items-center justify-center gap-2 group"
        >
          <RefreshCw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
          重新合盘
        </button>
        <button
          onClick={handleShare}
          disabled={isGeneratingImage}
          className="px-8 py-4 rounded-2xl bg-ink text-paper font-bold tracking-widest hover:bg-ink/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Share2 className="w-5 h-5" />
          {isGeneratingImage ? '生成中...' : '保存结果'}
        </button>
      </div>
    </motion.div>
  );
}

function PillarPanel({ title, pillars, meta }: { title: string; pillars: FourPillarDisplay[]; meta: string }) {
  return (
    <div className="space-y-4">
      <div className="text-center text-gold/60 text-sm tracking-widest font-medium uppercase">{title}</div>
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {pillars.map((pillar) => (
          <div key={pillar.label} className="rounded-[18px] border border-white/10 bg-white/5 px-2 py-4 text-center">
            <div className="text-[10px] md:text-xs text-paper/35 tracking-[0.2em] mb-3">{pillar.label}</div>
            <div className="text-3xl md:text-4xl font-bold leading-none text-paper">{pillar.tiangan}</div>
            <div className="mt-2 text-3xl md:text-4xl font-bold leading-none text-paper/80">{pillar.dizhi}</div>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-paper/40 tracking-widest">{meta}</div>
    </div>
  );
}
