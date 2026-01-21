import React, { useRef } from 'react';
import { X, Upload, ImageIcon, Zap } from 'lucide-react';
import { readFileAsBase64 } from '../utils';
import { UploadedFile } from '../types';

interface UploadBoxProps {
    label: string;
    file?: UploadedFile | null;
    files?: UploadedFile[];
    onChange: (files: UploadedFile[]) => void;
    onRemove: () => void;
    multiple?: boolean;
    className?: string;
}

export const UploadBox: React.FC<UploadBoxProps> = ({ label, file, onChange, onRemove, multiple, files = [], className }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const safeFiles = files || [];
    const hasFile = multiple ? safeFiles.length > 0 : !!file;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const selected = Array.from(e.target.files);
        if (selected.length === 0) return;

        const processFile = async (f: File): Promise<UploadedFile> => {
            const b64 = await readFileAsBase64(f);
            return {
                name: f.name,
                type: f.type,
                size: f.size,
                data: b64.split(',')[1],
                previewUrl: b64
            };
        };

        const processed = await Promise.all(selected.map(processFile));
        onChange(processed);
    };

    return (
        <div 
            className={`relative border-2 border-dashed rounded-xl transition-all duration-200 group ${
                hasFile ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200 bg-white hover:border-indigo-300'
            } ${className}`}
            onClick={() => fileInputRef.current?.click()}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange} 
                multiple={multiple} 
                accept="image/*"
            />
            
            {hasFile ? (
                <div className="absolute inset-0 p-2 overflow-hidden rounded-xl">
                    {multiple ? (
                        <div className="grid grid-cols-2 gap-1 w-full h-full">
                            {safeFiles.slice(0, 4).map((f, i) => (
                                <img key={i} src={f.previewUrl} className="w-full h-full object-cover rounded-lg" alt="preview" />
                            ))}
                        </div>
                    ) : (
                        <img src={file?.previewUrl} className="w-full h-full object-cover rounded-lg" alt="preview" />
                    )}
                    <button 
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full backdrop-blur-sm transition-colors"
                    >
                        <X size={14} />
                    </button>
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center gap-1 border border-white/10">
                         {multiple ? <ImageIcon size={10}/> : <Zap size={10} className="text-yellow-400 fill-yellow-400"/>}
                         {typeof label === 'string' ? label : "File"}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full p-6 text-center cursor-pointer">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-indigo-50 transition-colors">
                        <Upload size={20} className="text-gray-400 group-hover:text-indigo-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{typeof label === 'string' ? label : "Upload"}</p>
                    <p className="text-xs text-gray-400 mt-1">Klik untuk upload (Max 5MB)</p>
                </div>
            )}
        </div>
    );
};
