import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderOverlayProps {
    message: string;
}

export const LoaderOverlay: React.FC<LoaderOverlayProps> = ({ message }) => (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
        <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
            <Loader2 size={48} className="text-black animate-spin relative z-10" />
        </div>
        <p className="mt-6 text-lg font-medium text-gray-900 animate-pulse">{message}</p>
        <p className="text-sm text-gray-500 mt-2">AI sedang bekerja meracik konten viral...</p>
    </div>
);
