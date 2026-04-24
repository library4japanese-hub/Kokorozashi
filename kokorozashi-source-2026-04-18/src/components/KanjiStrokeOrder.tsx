import React, { useEffect, useRef } from 'react';
import HanziWriter from 'hanzi-writer';

interface KanjiStrokeOrderProps {
  kanji: string;
  size?: number;
}

export default function KanjiStrokeOrder({ kanji, size = 200 }: KanjiStrokeOrderProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);

  useEffect(() => {
    if (targetRef.current && kanji) {
      targetRef.current.innerHTML = ''; // Clear previous
      writerRef.current = HanziWriter.create(targetRef.current, kanji, {
        width: size,
        height: size,
        padding: 5,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 200,
        strokeColor: '#5A5A40',
        outlineColor: '#f0f0e8',
        showOutline: true,
      });
      writerRef.current.animateCharacter();
    }
  }, [kanji, size]);

  const handleAnimate = () => {
    writerRef.current?.animateCharacter();
  };

  const handleQuiz = () => {
    writerRef.current?.quiz();
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-[32px] border border-[#f0f0e8] shadow-sm">
      <div ref={targetRef} className="bg-[#fdfcf9] rounded-2xl border border-[#f0f0e8]" />
      <div className="flex gap-2">
        <button 
          onClick={handleAnimate}
          className="px-4 py-2 bg-[#5A5A40] text-white rounded-xl text-xs font-medium hover:bg-[#4a4a34] transition-all"
        >
          Animate
        </button>
        <button 
          onClick={handleQuiz}
          className="px-4 py-2 bg-amber-50 text-amber-800 rounded-xl text-xs font-medium border border-amber-100 hover:bg-amber-100 transition-all"
        >
          Practice Writing
        </button>
      </div>
    </div>
  );
}
