/**
 * HaulSense Brand Emblem / Icon
 * Matches the square rounded indigo emblem seen in the top-left of the attached screenshots.
 */

import React from 'react';

interface EmblemProps {
  className?: string;
  size?: number;
  onClick?: () => void;
}

export const Emblem: React.FC<EmblemProps> = ({ className = '', size = 38, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="HaulSense"
      className={`inline-flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-indigo-900/60 to-purple-950/80 border border-indigo-500/30 p-1.5 shadow-md shadow-indigo-950/50 hover:border-indigo-400/60 transition-all ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-indigo-400"
      >
        {/* Modern H monogram with freight corridor nodes */}
        <path
          d="M6 4V20M18 4V20M6 12H18"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="6" cy="4" r="1.75" fill="#818CF8" />
        <circle cx="18" cy="4" r="1.75" fill="#818CF8" />
        <circle cx="6" cy="20" r="1.75" fill="#818CF8" />
        <circle cx="18" cy="20" r="1.75" fill="#818CF8" />
        <circle cx="12" cy="12" r="1.5" fill="#F59E0B" />
      </svg>
    </button>
  );
};
