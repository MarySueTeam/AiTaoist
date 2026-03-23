import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, HelpCircle, Compass, Star, Wind } from 'lucide-react';

interface HelpFAQProps {
  isOpen: boolean;
  onClose: () => void;
}

function WuxingRelationChart() {
  const elements = [
    { name: '火', cx: 50, cy: 15, color: '#ef4444' },
    { name: '土', cx: 83, cy: 39, color: '#a16207' },
    { name: '金', cx: 71, cy: 78, color: '#eab308' },
    { name: '水', cx: 29, cy: 78, color: '#3b82f6' },
    { name: '木', cx: 17, cy: 39, color: '#22c55e' },
  ];

  return (
    <div className="relative w-full max-w-[250px] mx-auto aspect-square my-6">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <defs>
          <marker id="arrow-sheng" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#10b981" opacity="0.6" />
          </marker>
          <marker id="arrow-ke" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#ef4444" opacity="0.6" />
          </marker>
        </defs>
        
        {/* Sheng Lines (Outer) */}
        <g stroke="#10b981" strokeWidth="1.5" opacity="0.6" fill="none" markerEnd="url(#arrow-sheng)">
          <path d="M 17 39 L 42 19" />
          <path d="M 50 15 L 75 33" />
          <path d="M 83 39 L 74 70" />
          <path d="M 71 78 L 37 78" />
          <path d="M 29 78 L 20 47" />
        </g>

        {/* Ke Lines (Inner) */}
        <g stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" fill="none" markerEnd="url(#arrow-ke)">
          <path d="M 17 39 L 75 39" />
          <path d="M 83 39 L 35 72" />
          <path d="M 29 78 L 46 23" />
          <path d="M 50 15 L 67 70" />
          <path d="M 71 78 L 23 45" />
        </g>

        {/* Nodes */}
        {elements.map((el, i) => (
          <g key={i} className="text-[12px] font-bold" textAnchor="middle" dominantBaseline="central">
            <circle cx={el.cx} cy={el.cy} r="12" fill="white" stroke={el.color} strokeWidth="2" />
            <circle cx={el.cx} cy={el.cy} r="12" fill={el.color} opacity="0.1" />
            <text x={el.cx} y={el.cy} fill={el.color}>{el.name}</text>
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-4 mt-8 text-xs text-ink/60">
        <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-[#10b981]"></div>相生</div>
        <div className="flex items-center gap-1"><div className="w-4 h-0.5 border-t-2 border-dashed border-[#ef4444]"></div>相克</div>
      </div>
    </div>
  );
}

export default function HelpFAQ({ isOpen, onClose }: HelpFAQProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#f4f1ea] w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl border border-[#d5d0c4] relative"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-ink/40 hover:text-ink bg-white/50 hover:bg-white rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8 border-b border-black/5 pb-6">
              <BookOpen className="w-8 h-8 text-gold" />
              <h2 className="text-3xl font-bold tracking-widest text-ink">玄门指南</h2>
            </div>

            <div className="space-y-10">
              {/* Section 1: 八字基础 */}
              <section>
                <h3 className="flex items-center gap-2 text-xl font-bold text-ink mb-4">
                  <Star className="w-5 h-5 text-cinnabar" />
                  什么是四柱八字？
                </h3>
                <div className="space-y-3 text-ink/80 text-sm md:text-base leading-relaxed font-sans bg-white/50 p-6 rounded-2xl border border-black/5">
                  <p>
                    <strong>四柱八字</strong>，即生辰八字，是记录一个人出生的年、月、日、时。古人以天干地支来纪年、纪月、纪日、纪时，每柱两个字，四柱共八个字，故称“八字”。
                  </p>
                  <p>
                    八字排盘是根据万年历，将您的出生时间转换为天干地支的组合。本应用采用专业万年历算法，精确计算节气交接，确保排盘准确无误。
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>年柱：</strong>代表祖上、早年运势。</li>
                    <li><strong>月柱：</strong>代表父母、兄弟姐妹、青年运势。</li>
                    <li><strong>日柱：</strong>代表自己（日干）和配偶（日支）、中年运势。</li>
                    <li><strong>时柱：</strong>代表子女、晚年运势。</li>
                  </ul>
                </div>
              </section>

              {/* Section 1.5: 五行相生相克 */}
              <section>
                <h3 className="flex items-center gap-2 text-xl font-bold text-ink mb-4">
                  <Wind className="w-5 h-5 text-blue-500" />
                  五行相生相克关系
                </h3>
                <div className="space-y-3 text-ink/80 text-sm md:text-base leading-relaxed font-sans bg-white/50 p-6 rounded-2xl border border-black/5">
                  <p>
                    五行（金、木、水、火、土）是中国古代哲学的一种系统观。五行之间存在着相生相克的关系，这是八字命理推演的基础。
                  </p>
                  <WuxingRelationChart />
                  <ul className="list-disc pl-5 space-y-1 mt-4">
                    <li><strong>相生：</strong>木生火，火生土，土生金，金生水，水生木。代表促进、滋生、助长。</li>
                    <li><strong>相克：</strong>木克土，土克水，水克火，火克金，金克木。代表制约、克制、抑制。</li>
                  </ul>
                </div>
              </section>

              {/* Section 2: 大六壬基础 */}
              <section>
                <h3 className="flex items-center gap-2 text-xl font-bold text-ink mb-4">
                  <Compass className="w-5 h-5 text-jade" />
                  什么是大六壬？
                </h3>
                <div className="space-y-3 text-ink/80 text-sm md:text-base leading-relaxed font-sans bg-white/50 p-6 rounded-2xl border border-black/5">
                  <p>
                    <strong>大六壬</strong>是中国古老的三式（太乙、奇门、六壬）之一，被誉为“人事之王”。它主要用于占卜具体事件的吉凶成败。
                  </p>
                  <p>
                    六壬起课需要“所问之事”与“起卦时间”。它通过地支的生克制化，推演出“四课”与“三传”。
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>四课：</strong>反映事物当前的客观状态和主客关系。</li>
                    <li><strong>三传：</strong>（初传、中传、末传）代表事物发展的起因、经过和结果，是断事的关键。</li>
                  </ul>
                </div>
              </section>

              {/* Section 3: 如何解读 */}
              <section>
                <h3 className="flex items-center gap-2 text-xl font-bold text-ink mb-4">
                  <HelpCircle className="w-5 h-5 text-gold" />
                  如何解读测算结果？
                </h3>
                <div className="space-y-3 text-ink/80 text-sm md:text-base leading-relaxed font-sans bg-white/50 p-6 rounded-2xl border border-black/5">
                  <p>
                    <strong>1. 五行喜忌与用神：</strong> 命局中五行力量不均，需要“用神”来平衡。喜神、用神代表对您有利的五行（如颜色、方位、行业），忌神则是需要避免的。
                  </p>
                  <p>
                    <strong>2. 大运与流年：</strong> “命”是静态的八字，“运”是动态的轨迹。大运十年一变，流年一年一变。在大运流年图表中，您可以清晰看到运势的起伏。点击特定大运，还可查看该阶段内每一年（流年）的详细运势。
                  </p>
                  <p>
                    <strong>3. 语气模式：</strong> 默认模式会尽量保持客观平衡；“毒舌模式”会更直接、更不留情面地指出问题；“甜嘴模式”则会尽量挑好的讲，更强调优势、转机与鼓励性的表达。
                  </p>
                  <p className="text-cinnabar/80 font-bold mt-4">
                    免责声明：命理测算仅供娱乐与文化参考。命运始终掌握在自己手中，切勿过度迷信。
                  </p>
                </div>
              </section>

              {/* Section 4: 功能总览 */}
              <section>
                <h3 className="flex items-center gap-2 text-xl font-bold text-ink mb-4">
                  <Compass className="w-5 h-5 text-jade" />
                  功能总览
                </h3>
                <div className="space-y-3 text-ink/80 text-sm md:text-base leading-relaxed font-sans bg-white/50 p-6 rounded-2xl border border-black/5">
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>八字排盘：</strong>四柱八字、藏干、神煞、五行强弱与喜忌、性格与人生六大主题总评。</li>
                    <li><strong>大运流年：</strong>十年大运主线与每年流年细分趋势，支持逐年查看与分项评分。</li>
                    <li><strong>流日运势：</strong>结合原局与当下岁运的日级简报，含宜忌与风险提示。</li>
                    <li><strong>八字合盘：</strong>双方八字匹配度与相处模式分析，给出未来走向与建议。</li>
                    <li><strong>大六壬：</strong>四课三传推演，适合具体事件占断与行动建议。</li>
                    <li><strong>小六壬：</strong>快速起课，适合日常小事与即时判断。</li>
                    <li><strong>六爻：</strong>本卦、变卦、动爻、世应、用神与六亲综合断事，支持时间起卦与铜钱起卦。</li>
                    <li><strong>毒舌模式：</strong>开启后用语更直白严厉，直指问题与风险点。</li>
                    <li><strong>甜嘴模式：</strong>开启后会尽量多讲优点、机会与可改善空间，整体表达更柔和。</li>
                    <li><strong>模型切换：</strong>可在左上角切换不同 AI 模型，影响推演风格与细节颗粒度。</li>
                    <li><strong>结果分享：</strong>支持将测算结果生成图片并保存或分享。</li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
