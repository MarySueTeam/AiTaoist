import { motion } from 'motion/react';
import StreamingTextPanel from './StreamingTextPanel';

interface LoadingTaiChiProps {
  streamText?: string;
}

export default function LoadingTaiChi({ streamText }: LoadingTaiChiProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="relative w-32 h-32 rounded-full border-4 border-ink overflow-hidden bg-paper shadow-2xl"
      >
        <div className="absolute inset-0 flex">
          <div className="w-1/2 h-full bg-ink"></div>
          <div className="w-1/2 h-full bg-paper"></div>
        </div>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-ink rounded-full flex items-center justify-center">
          <div className="w-4 h-4 bg-paper rounded-full"></div>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-16 bg-paper rounded-full flex items-center justify-center">
          <div className="w-4 h-4 bg-ink rounded-full"></div>
        </div>
      </motion.div>

      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mt-8 text-ink tracking-[0.3em] font-medium"
      >
        太极生两仪，两仪生四象...
      </motion.p>
      <p className="mt-2 text-ink/60 text-sm tracking-widest">道长正在为您推演命盘</p>

      {streamText ? (
        <div className="mt-8 w-full max-w-3xl shadow-sm backdrop-blur">
          <StreamingTextPanel
            title="实时推演中"
            text={streamText}
            tone="ink"
            maxHeightClassName="max-h-[28rem]"
          />
        </div>
      ) : null}
    </div>
  );
}
