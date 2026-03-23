import React from 'react';
import { motion } from 'motion/react';
import { LuRenResult as ILuRenResult } from '../services/fortuneService';
import { Scroll, MessageCircle, Share2, Download, Loader2 } from 'lucide-react';
import { shareAsImage } from '../utils/shareUtils';
import { useState, useRef } from 'react';

interface LuRenResultProps {
  result: ILuRenResult;
  onReset: () => void;
}

export default function LuRenResult({ result, onReset }: LuRenResultProps) {
  const SHARE_CARD_ID = 'luren-share-card';
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    setIsGeneratingImage(true);
    try {
      await shareAsImage(SHARE_CARD_ID, `luren_result_${new Date().getTime()}.png`);
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
          四课三传
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h4 className="text-paper/50 text-sm border-b border-paper/20 pb-2 tracking-widest text-center lg:text-left">四课</h4>
            <div className="flex justify-around items-end h-40">
              {result.sike.map((ke, idx) => (
                <div key={idx} className="writing-vertical text-2xl md:text-3xl font-bold tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-b from-paper to-paper/50">
                  {ke}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="text-paper/50 text-sm border-b border-paper/20 pb-2 tracking-widest text-center lg:text-left">三传</h4>
            <div className="flex justify-around items-end h-40">
              {result.sanchuan.map((chuan, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-xs text-jade mb-4 tracking-widest">{['初传', '中传', '末传'][idx]}</span>
                  <div className="writing-vertical text-3xl md:text-4xl font-bold tracking-[0.3em] text-paper drop-shadow-md">
                    {chuan}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-6 border-t border-paper/10 text-center text-paper/80 font-sans text-sm md:text-base">
          <span className="text-jade mr-2 font-bold tracking-widest">天盘：</span> {result.tianpan}
        </div>
      </div>

      {/* 测算结果区 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResultCard 
          title="课体断语" 
          icon={<Scroll className="w-6 h-6" />}
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
              <div className="text-xs tracking-[0.45em] text-[#7ab89a] mb-3">大六壬</div>
              <div className="grid grid-cols-2 gap-8">
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
                  <div className="text-sm text-white/60 tracking-[0.28em] mb-4">四课</div>
                  <div className="grid grid-cols-4 gap-3">
                    {result.sike.map((item, idx) => (
                      <div key={`sike-${idx}`} className="rounded-[18px] bg-white/10 px-4 py-6 text-center text-2xl font-bold tracking-[0.18em]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
                  <div className="text-sm text-white/60 tracking-[0.28em] mb-4">三传</div>
                  <div className="grid grid-cols-3 gap-3">
                    {result.sanchuan.map((item, idx) => (
                      <div key={`sanchuan-${idx}`} className="rounded-[18px] bg-white/10 px-4 py-6 text-center">
                        <div className="text-xs text-[#d4af37] mb-2">{['初传', '中传', '末传'][idx]}</div>
                        <div className="text-2xl font-bold tracking-[0.18em]">{item}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/80">
                <span className="text-[#d4af37] mr-2">天盘</span>
                {result.tianpan}
              </div>
            </div>

            <div className="px-10 py-8 grid grid-cols-2 gap-5">
              {[
                { title: '课体断语', content: result.overall },
                { title: '指点迷津', content: result.advice },
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

      <div className="flex justify-center gap-4 pt-12" data-html2canvas-ignore>
        <button
          onClick={onReset}
          className="px-8 py-4 bg-ink text-paper rounded-full hover:bg-ink/90 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 tracking-[0.2em] font-bold text-base"
        >
          重新起课
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
