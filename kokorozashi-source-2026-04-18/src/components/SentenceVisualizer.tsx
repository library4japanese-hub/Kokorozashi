import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface SentenceNode {
  text: string;
  role: string;
  children?: SentenceNode[];
}

interface SentenceVisualizerProps {
  sentence: string;
  analysis?: {
    nodes: SentenceNode[];
  };
}

export default function SentenceVisualizer({ sentence, analysis }: SentenceVisualizerProps) {
  if (!analysis) return (
    <div className="p-8 bg-brand/5 rounded-[32px] border border-brand/10 text-center">
      <p className="text-brand/60 italic font-serif">Analyzing sentence structure...</p>
    </div>
  );

  const renderNode = (node: SentenceNode, depth = 0) => (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: depth * 0.1 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="px-4 py-2 bg-white border border-brand/10 rounded-xl shadow-sm text-center min-w-[80px]">
        <p className="japanese-text font-bold text-lg text-slate-900">{node.text}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-brand/60">{node.role}</p>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="flex gap-4 mt-4 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-brand/10" />
          {node.children.map((child, idx) => (
            <div key={idx} className="relative pt-4">
              <div className="absolute top-0 left-0 right-0 h-px bg-brand/10" />
              {renderNode(child, depth + 1)}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="p-10 bg-brand/5 rounded-[40px] border border-brand/10 overflow-x-auto custom-scrollbar">
      <div className="flex justify-center min-w-max">
        {analysis.nodes.map((node, idx) => (
          <div key={idx} className="mx-4">
            {renderNode(node)}
          </div>
        ))}
      </div>
    </div>
  );
}
