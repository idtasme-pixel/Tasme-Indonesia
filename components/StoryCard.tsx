import React, { useState } from 'react';
import { Video, Check, Copy } from 'lucide-react';
import { copyTextToClipboard } from '../utils';
import { PROMPT_PLATFORMS } from '../constants';
import { PlatformPrompt } from '../types';

interface StoryCardProps {
    imgBase64: string;
    idx: number;
    sceneDescription: string;
    prompts: PlatformPrompt;
}

export const StoryCard: React.FC<StoryCardProps> = ({ imgBase64, idx, sceneDescription, prompts }) => {
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null); 
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        if (!selectedPlatform) return;
        const text = prompts[selectedPlatform] || "Prompt tidak tersedia.";
        
        const success = await copyTextToClipboard(text);
        
        if (success) {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } else {
            alert("Gagal menyalin. Mohon salin manual.");
        }
    };

    const activePlatform = selectedPlatform ? PROMPT_PLATFORMS.find(p => p.id === selectedPlatform) : null;

    return (
        <div className="group relative bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md">
            <div className="relative aspect-[9/16] w-full bg-gray-200">
                <img src={`data:image/png;base64,${imgBase64}`} alt={`Shot ${idx+1}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/20">
                    Shot {idx + 1}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 pointer-events-none">
                    <p className="text-xs text-white line-clamp-3">{sceneDescription || "Visual Prompt"}</p>
                </div>
            </div>

            <div className="bg-white border-t border-gray-100 p-2 flex flex-col gap-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                    {PROMPT_PLATFORMS.map(platform => (
                        <button
                            key={platform.id}
                            onClick={() => setSelectedPlatform(prev => prev === platform.id ? null : platform.id)}
                            className={`flex items-center justify-center py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all border gap-1 ${
                                selectedPlatform === platform.id 
                                    ? `${platform.bg} ${platform.text} ${platform.border}` 
                                    : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                            }`}
                        >
                            {platform.icon}
                            <span className="truncate">{platform.label.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>

                {selectedPlatform && activePlatform && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                        <div className="relative">
                            <textarea 
                                readOnly
                                className="w-full h-20 text-[10px] text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2 resize-none outline-none mb-2 font-mono leading-tight"
                                value={prompts[selectedPlatform] || "Prompt loading..."}
                            />
                            <button 
                                onClick={handleCopy}
                                className="absolute top-1 right-1 bg-white border border-gray-200 p-1 rounded hover:bg-gray-50 transition-colors"
                                title="Copy Prompt"
                            >
                                {isCopied ? <Check size={12} className="text-green-600"/> : <Copy size={12} className="text-gray-500"/>}
                            </button>
                        </div>

                        {activePlatform.url ? (
                            <a 
                                href={activePlatform.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold text-white transition-all shadow-sm ${activePlatform.color}`}
                            >
                                <Video size={14} />
                                Buat Video
                            </a>
                        ) : (
                            <button disabled className="w-full py-2 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-400 cursor-not-allowed">
                                Link Manual
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
