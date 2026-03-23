import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface StreamingTextPanelProps {
  title: string;
  text: string;
  tone?: 'cinnabar' | 'jade' | 'ink';
  maxHeightClassName?: string;
}

const toneClasses: Record<NonNullable<StreamingTextPanelProps['tone']>, string> = {
  cinnabar: 'border-cinnabar/20 bg-cinnabar/5 text-cinnabar',
  jade: 'border-jade/20 bg-jade/5 text-jade',
  ink: 'border-black/10 bg-white/70 text-ink/60',
};

export default function StreamingTextPanel({
  title,
  text,
  tone = 'ink',
  maxHeightClassName = 'max-h-[40vh] sm:max-h-72',
}: StreamingTextPanelProps) {
  const contentRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (!contentRef.current) {
      return;
    }

    contentRef.current.scrollTop = contentRef.current.scrollHeight;
  }, [text]);

  if (!text) {
    return null;
  }

  return (
    <div className={`rounded-2xl border p-3 sm:p-4 overflow-hidden ${toneClasses[tone]}`}>
      <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.3em]">
        <span>STREAMING</span>
        <motion.span
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block h-2 w-2 rounded-full bg-current"
        />
      </div>
      <div className="mb-3 text-sm font-semibold tracking-widest leading-6">{title}</div>
      <pre
        ref={contentRef}
        className={`${maxHeightClassName} overflow-y-auto overscroll-contain whitespace-pre-wrap break-words font-sans text-[13px] sm:text-sm leading-6 sm:leading-7 text-ink/80 pr-1`}
      >
        {text}
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          className="ml-1 inline-block h-5 w-[2px] translate-y-1 bg-current align-bottom"
        />
      </pre>
    </div>
  );
}
