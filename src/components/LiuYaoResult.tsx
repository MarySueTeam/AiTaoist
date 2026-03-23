import React from 'react';
import { motion } from 'motion/react';
import { LiuYaoResult as ILiuYaoResult } from '../services/fortuneService';
import { Scroll, MessageCircle, Share2, Hexagon, Target, Users, BookOpen, Download, Loader2 } from 'lucide-react';
import { shareAsImage } from '../utils/shareUtils';
import { useState, useRef } from 'react';

interface LiuYaoResultProps {
  result: ILiuYaoResult;
  onReset: () => void;
}

function HexagramLine({ type }: { type: string; key?: React.Key }) {
  const isYang = type === '阳';
  return (
    <div className="flex items-center justify-center w-full h-4 md:h-6 mb-2">
      {isYang ? (
        <div className="w-full h-full bg-paper/80 rounded-sm"></div>
      ) : (
        <div className="w-full h-full flex justify-between">
          <div className="w-[45%] h-full bg-paper/80 rounded-sm"></div>
          <div className="w-[45%] h-full bg-paper/80 rounded-sm"></div>
        </div>
      )}
    </div>
  );
}

function HexagramDisplay({ lines, name, isBengua }: { lines: string[], name: string, isBengua?: boolean }) {
  // lines are from bottom to top (初爻 to 上爻), so we reverse to render top to bottom
  const displayLines = [...lines].reverse();
  
  return (
    <div className="flex flex-col items-center w-32 md:w-48">
      <div className="w-full flex flex-col mb-6">
        {displayLines.map((line, idx) => (
          <HexagramLine key={idx} type={line} />
        ))}
      </div>
      <span className="text-xs text-paper/50 mb-2 tracking-widest">{name === '无' ? '无变卦' : isBengua ? '本卦' : '变卦'}</span>
      <div className="text-3xl md:text-4xl font-bold tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-b from-paper to-paper/50">
        {name}
      </div>
    </div>
  );
}

export default function LiuYaoResult({ result, onReset }: LiuYaoResultProps) {
  const SHARE_CARD_ID = 'liuyao-share-card';
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    setIsGeneratingImage(true);
    try {
      await shareAsImage(SHARE_CARD_ID, `liuyao_result_${new Date().getTime()}.png`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <motion.div 
      ref={resultRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-5xl mx-auto space-y-8 pb-12"
    >
      {/* 排盘展示区 */}
      <div className="bg-ink text-paper p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-jade/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-jade/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-jade/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
        
        <h3 className="text-center text-jade text-xl md:text-2xl tracking-[0.5em] mb-12 font-light border-b border-jade/20 pb-4 inline-block mx-auto flex justify-center">
          六爻卦象
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="flex flex-col items-center">
            <HexagramDisplay lines={result.benguaLines} name={result.bengua} isBengua={true} />
          </div>
          <div className="flex flex-col items-center">
            {result.biangua !== '无' && result.bianguaLines && result.bianguaLines.length === 6 ? (
              <HexagramDisplay lines={result.bianguaLines} name={result.biangua} isBengua={false} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <span className="text-xs text-paper/50 mb-2 tracking-widest">变卦</span>
                <div className="text-2xl md:text-3xl font-bold tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-b from-paper to-paper/50 mt-8">
                  无变卦
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-paper/10">
          <div className="text-center">
            <span className="text-jade font-bold tracking-widest block mb-2 text-sm">用神</span>
            <div className="text-paper/80 font-sans text-sm">{result.yongshen}</div>
          </div>
          <div className="text-center">
            <span className="text-jade font-bold tracking-widest block mb-2 text-sm">世应</span>
            <div className="text-paper/80 font-sans text-sm">{result.shiying}</div>
          </div>
          <div className="text-center">
            <span className="text-jade font-bold tracking-widest block mb-2 text-sm">六亲</span>
            <div className="text-paper/80 font-sans text-sm">{result.liuqin}</div>
          </div>
        </div>

        {result.yaoci && result.yaoci.length > 0 && (
          <div className="mt-12 pt-6 border-t border-paper/10 text-center text-paper/80 font-sans text-sm md:text-base">
            <span className="text-jade mr-2 font-bold tracking-widest">爻辞解析：</span>
            <div className="mt-4 space-y-2">
              {result.yaoci.map((yao, idx) => (
                <div key={idx} className="text-paper/70">{yao}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 测算结果区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResultCard 
          title="卦象断语" 
          icon={<Hexagon className="w-6 h-6" />}
          content={result.overall}
          className="bg-gradient-to-br from-white/90 to-white/50 border-jade/30 shadow-lg h-full"
          titleClassName="text-xl text-ink"
          iconClassName="text-jade"
        />
        
        <ResultCard 
          title="指点迷津" 
          icon={<MessageCircle className="w-6 h-6" />}
          content={result.advice}
          className="bg-white/80 h-full"
          titleClassName="text-xl text-ink"
          iconClassName="text-ink/60"
        />
      </div>

      <ResultCard 
        title="深度解析" 
        icon={<BookOpen className="w-6 h-6" />}
        content={result.detailedAnalysis}
        className="bg-white/60 h-full"
        titleClassName="text-xl text-ink"
        iconClassName="text-ink/60"
      />

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
              <div className="text-xs tracking-[0.45em] text-[#7ab89a] mb-3">六爻卦象</div>
              <div className="grid grid-cols-2 gap-8 items-start">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
                  <div className="text-sm text-white/60 tracking-[0.28em] mb-4">本卦</div>
                  <div className="text-4xl font-bold tracking-[0.24em] text-white">{result.bengua}</div>
                  <div className="mt-5 space-y-2">
                    {[...result.benguaLines].reverse().map((line, idx) => (
                      <div key={`share-bengua-${idx}`} className="h-4 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-[#d8eee5]" style={{ width: line === '阳' ? '100%' : '42%' }} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
                  <div className="text-sm text-white/60 tracking-[0.28em] mb-4">变卦</div>
                  <div className="text-4xl font-bold tracking-[0.24em] text-white">{result.biangua}</div>
                  <div className="mt-5 space-y-2">
                    {(result.bianguaLines?.length ? [...result.bianguaLines].reverse() : []).map((line, idx) => (
                      <div key={`share-biangua-${idx}`} className="h-4 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-[#d8eee5]" style={{ width: line === '阳' ? '100%' : '42%' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-10 py-8 space-y-6">
              <div className="grid grid-cols-3 gap-5">
                {[
                  { title: '用神', content: result.yongshen },
                  { title: '世应', content: result.shiying },
                  { title: '六亲', content: result.liuqin },
                ].map((section) => (
                  <div key={section.title} className="rounded-[24px] border border-[#e5ded1] bg-[#fbf8f3] p-5">
                    <div className="text-xs tracking-[0.3em] text-[#8a7358] mb-3">{section.title}</div>
                    <div className="text-[15px] leading-8 text-[#374151] whitespace-pre-wrap">{section.content}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-5">
                {[
                  { title: '卦象断语', content: result.overall },
                  { title: '指点迷津', content: result.advice },
                ].map((section) => (
                  <div key={section.title} className="rounded-[24px] border border-[#e5ded1] bg-white p-6">
                    <div className="text-xs tracking-[0.3em] text-[#8a7358] mb-3">{section.title}</div>
                    <div className="text-[15px] leading-8 text-[#374151] whitespace-pre-wrap">{section.content}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-[24px] border border-[#e5ded1] bg-white p-6">
                <div className="text-xs tracking-[0.3em] text-[#8a7358] mb-3">深度解析</div>
                <div className="text-[15px] leading-8 text-[#374151] whitespace-pre-wrap">{result.detailedAnalysis}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-12" data-html2canvas-ignore>
        <button
          onClick={onReset}
          className="px-8 py-4 bg-ink text-paper rounded-full hover:bg-ink/90 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 tracking-[0.2em] font-bold text-base"
        >
          重新起卦
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

interface ResultCardProps {
  title: string;
  icon: React.ReactNode;
  content: string;
  className?: string;
  titleClassName?: string;
  iconClassName?: string;
}

function ResultCard({ title, icon, content, className = '', titleClassName = 'text-lg', iconClassName = 'text-jade' }: ResultCardProps) {
  return (
    <div className={`bg-white/60 backdrop-blur-md p-6 md:p-8 rounded-[2rem] border border-[#d5d0c4] shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <div className={`flex items-center gap-3 mb-6 border-b border-black/5 pb-4 ${iconClassName}`}>
        {icon}
        <h4 className={`font-bold tracking-widest ${titleClassName}`}>{title}</h4>
      </div>
      <div className="text-ink/80 leading-loose font-sans whitespace-pre-wrap text-sm md:text-base">
        {content}
      </div>
    </div>
  );
}
