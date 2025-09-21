import React from 'react';
import { OMRResult } from '@/types';

interface BubbleOverlayProps {
  result: OMRResult;
  onQuestionClick: (qIdx: number, newChoice: string) => void;
  zoom: number;
}

const BubbleOverlay: React.FC<BubbleOverlayProps> = ({ result, onQuestionClick, zoom }) => {
  const getBubbleColor = (question: any) => {
    if (result.flags.low_confidence.includes(question.q_idx)) return '#ef4444'; // flagged
    if (result.flags.ambiguous_questions.includes(question.q_idx)) return '#f59e0b'; // ambiguous 
    if (question.confidence > 0.8) return '#22c55e'; // accepted
    return '#3b82f6'; // corrected
  };

  return (
    <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
      <img 
        src={result.artifacts.warped_url} 
        alt="Warped OMR Sheet"
        className="w-full h-auto"
      />
      <svg 
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 600"
        preserveAspectRatio="xMidYMid meet"
      >
        {result.per_question.map((q, idx) => (
          <g key={q.q_idx}>
            {['A', 'B', 'C', 'D'].map((choice, choiceIdx) => (
              <circle
                key={`${q.q_idx}-${choice}`}
                cx={80 + choiceIdx * 40}
                cy={80 + idx * 45}
                r="12"
                fill={q.choice === choice ? getBubbleColor(q) : 'transparent'}
                stroke={q.choice === choice ? getBubbleColor(q) : '#9ca3af'}
                strokeWidth="2"
                className="cursor-pointer hover:stroke-primary transition-colors"
                onClick={() => onQuestionClick(q.q_idx, choice)}
                aria-label={`Question ${q.q_idx}, Choice ${choice}, Confidence: ${(q.confidence * 100).toFixed(0)}%`}
              />
            ))}
            <text
              x="40"
              y={80 + idx * 45 + 5}
              className="text-sm font-medium fill-foreground"
            >
              {q.q_idx}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default BubbleOverlay;
