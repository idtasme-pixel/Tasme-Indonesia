import React from 'react';
import { ContentStyle } from '../types';

interface VibeCardProps {
    vibe: ContentStyle;
    isSelected: boolean;
    onClick: (id: string) => void;
}

export const VibeCard: React.FC<VibeCardProps> = ({ vibe, isSelected, onClick }) => (
    <button
        onClick={() => onClick(vibe.id)}
        className={`
            flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border
            ${isSelected 
                ? 'bg-black text-white border-black shadow-lg transform -translate-y-1' 
                : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:shadow-md'
            }
        `}
    >
        <div className={`mb-2 ${isSelected ? 'text-yellow-400' : 'text-gray-400'}`}>
            {vibe.icon}
        </div>
        <span className="text-xs font-semibold tracking-wide">{vibe.name}</span>
    </button>
);
