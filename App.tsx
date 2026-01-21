
import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Trash2, Check, ChevronRight, FileText, Volume2, 
  Mic, Play, Pause, ImageIcon, Images, Music, FileDown, Copy, Type,
  Layout, User, MapPin, Settings2, ArrowLeft, Zap
} from 'lucide-react';

import { UploadBox } from './components/UploadBox';
import { VibeCard } from './components/VibeCard';
import { StoryCard } from './components/StoryCard';
import { LoaderOverlay } from './components/LoaderOverlay';
import { GeminiService } from './services/geminiService';
import { base64ToArrayBuffer, pcmToWav } from './utils';
import { 
  CONTENT_STYLES, LANGUAGES, SCRIPT_STYLES, 
  PROMPT_PLATFORMS, TTS_VOICES 
} from './constants';
import { UploadedFile, GeneratedContent, UploadedFilesState } from './types';

export default function App() {
    const [selectedStyle, setSelectedStyle] = useState('direct');
    const [description, setDescription] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('id-ID');
    const [selectedScriptStyle, setSelectedScriptStyle] = useState('clear');
    const [downloadPlatformPref, setDownloadPlatformPref] = useState('dreamina'); 
    
    const [editableScript, setEditableScript] = useState('');
    const [activeAssetTab, setActiveAssetTab] = useState<'primary' | 'character' | 'environment'>('primary');

    // Dual Input States
    const [modelMode, setModelMode] = useState<'upload' | 'prompt'>('upload');
    const [modelPrompt, setModelPrompt] = useState('');
    const [bgMode, setBgMode] = useState<'upload' | 'prompt'>('upload');
    const [bgPrompt, setBgPrompt] = useState('');

    const [uploadedFiles, setUploadedFiles] = useState<UploadedFilesState>({ 
        product: null, 
        model: null, 
        locations: [], 
        fashionItems: [], 
        background: null 
    });
    
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [activeAudioVoice, setActiveAudioVoice] = useState('Fenrir');
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const isTreadmill = selectedStyle === 'treadmill_fashion_show';
    const isLocationMode = selectedStyle === 'property';
    const isHandsOn = selectedStyle === 'aesthetic_hands_on';

    useEffect(() => {
        if (!window.JSZip) {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    useEffect(() => {
        setGeneratedContent(null);
        setAudioUrl(null);
    }, [selectedStyle]);

    useEffect(() => {
        if (generatedContent?.tiktokScript) {
            setEditableScript(generatedContent.tiktokScript);
        }
    }, [generatedContent]);

    const handleUpload = (key: keyof UploadedFilesState, files: UploadedFile[]) => {
        setUploadedFiles(prev => {
            const isArrayType = ['locations', 'fashionItems'].includes(key);
            if (isArrayType) {
                const currentFiles = (prev[key] as UploadedFile[]) || [];
                return { ...prev, [key]: [...currentFiles, ...files] };
            }
            return { ...prev, [key]: files[0] };
        });
    };

    const handleRemove = (key: keyof UploadedFilesState, index: number | null = null) => {
        setUploadedFiles(prev => {
            const isArrayType = ['locations', 'fashionItems'].includes(key);
            if (isArrayType) {
                const currentArr = (prev[key] as UploadedFile[]) || [];
                if (index !== null && currentArr.length > index) {
                    const newArr = [...currentArr];
                    newArr.splice(index, 1);
                    return { ...prev, [key]: newArr };
                }
                return { ...prev, [key]: [] };
            }
            return { ...prev, [key]: null };
        });
    };

    const clearAllUploads = () => {
        if(window.confirm("Hapus semua file?")) {
            setUploadedFiles({ product: null, model: null, locations: [], fashionItems: [], background: null });
            setModelPrompt('');
            setBgPrompt('');
        }
    };

    const runGeneration = async () => {
        if (isLocationMode && uploadedFiles.locations.length === 0) return alert("Upload foto lokasi.");
        if (isTreadmill && uploadedFiles.fashionItems.length === 0) return alert("Upload item fashion.");
        if (!isTreadmill && !isLocationMode && !uploadedFiles.product) return alert("Upload produk utama.");
        if (!description && !isTreadmill) return alert("Isi deskripsi campaign.");

        setIsGenerating(true);
        setGeneratedContent(null);
        setAudioUrl(null);

        try {
            setLoadingStep('Tasme AI sedang menganalisis visual...');
            let fullDescription = description;
            if (modelMode === 'prompt' && modelPrompt) fullDescription += `\n\n[MODEL]: ${modelPrompt}`;
            if (bgMode === 'prompt' && bgPrompt) fullDescription += `\n\n[BACKGROUND]: ${bgPrompt}`;

            const plan = await GeminiService.getCreativePlan(selectedStyle, uploadedFiles, fullDescription, selectedLanguage, selectedScriptStyle);
            setLoadingStep(`Memvisualisasikan campaign...`);
            
            const extraContext = {
                model: modelMode === 'prompt' ? modelPrompt : undefined,
                background: bgMode === 'prompt' ? bgPrompt : undefined
            };

            let imagePromises: Promise<string>[] = [];
            if (isTreadmill) {
                imagePromises = uploadedFiles.fashionItems.map((fashionItem, index) => {
                    const prompt = plan.shotPrompts[index] || plan.shotPrompts[0];
                    const activeRefs = [fashionItem];
                    if (modelMode === 'upload' && uploadedFiles.model) activeRefs.push(uploadedFiles.model);
                    if (bgMode === 'upload' && uploadedFiles.background) activeRefs.push(uploadedFiles.background);
                    return GeminiService.generateImage(prompt, activeRefs, selectedStyle, extraContext);
                });
            } else if (isLocationMode) {
                imagePromises = uploadedFiles.locations.map((loc, index) => {
                    const prompt = plan.shotPrompts[index] || plan.shotPrompts[0];
                    return GeminiService.generateImage(prompt, [loc], selectedStyle, extraContext);
                });
            } else {
                let activeRefFiles: UploadedFile[] = [];
                if (isHandsOn) {
                    if (uploadedFiles.product) activeRefFiles.push(uploadedFiles.product);
                    if (bgMode === 'upload' && uploadedFiles.background) activeRefFiles.push(uploadedFiles.background);
                } else {
                    if (uploadedFiles.product) activeRefFiles.push(uploadedFiles.product);
                    if (modelMode === 'upload' && uploadedFiles.model) activeRefFiles.push(uploadedFiles.model);
                    if (bgMode === 'upload' && uploadedFiles.background) activeRefFiles.push(uploadedFiles.background);
                }
                activeRefFiles = activeRefFiles.filter(Boolean);
                imagePromises = plan.shotPrompts.map((prompt: string) => GeminiService.generateImage(prompt, activeRefFiles, selectedStyle, extraContext));
            }

            const images = await Promise.all(imagePromises);
            setGeneratedContent({ ...plan, images });
        } catch (e: any) {
            alert("Gagal: " + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const generateAudio = async () => {
        if (!editableScript) return;
        try {
            const b64Audio = await GeminiService.generateTTS(editableScript, activeAudioVoice);
            const pcmData = base64ToArrayBuffer(b64Audio);
            const wavBlob = pcmToWav(new Int16Array(pcmData), 1, 24000);
            setAudioUrl(URL.createObjectURL(wavBlob));
        } catch (e: any) { alert(e.message); }
    };

    const downloadImages = async () => {
        if (!generatedContent || !window.JSZip) return;
        const zip = new window.JSZip();
        generatedContent.images.forEach((b64, i) => zip.file(`shot_${i+1}.png`, b64, { base64: true }));
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `Tasme_Campaign_Images.zip`;
        link.click();
    };

    const downloadDoc = () => {
        if (!generatedContent) return;
        const htmlContent = `<html><body><h1>${generatedContent.tiktokMetadata?.description}</h1><hr/><h2>NASKAH</h2><p>${editableScript.replace(/\n/g, '<br/>')}</p></body></html>`;
        const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Tasme_Script.doc`;
        link.click();
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFF] text-slate-900 font-sans selection:bg-indigo-100">
            {isGenerating && <LoaderOverlay message={loadingStep} />}

            <header className="bg-white border-b border-slate-100 sticky top-0 z-40 backdrop-blur-md bg-white/80">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
                             <Zap size={24} className="text-white fill-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-extrabold text-2xl tracking-tighter leading-none">TASME<span className="text-indigo-600">INDONESIA</span></span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-0.5">by Tasme Indonesia</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={clearAllUploads} className="text-slate-300 hover:text-red-500 transition-all p-2 rounded-full hover:bg-red-50">
                            <Trash2 size={18} />
                        </button>
                        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                            <Sparkles size={12} className="text-indigo-400" />
                            AI Powered Studio
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {!generatedContent ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
                        <div className="text-center max-w-3xl mx-auto">
                            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 leading-[1.1]">
                                Viral Ads for <span className="text-indigo-600">Indonesian Market.</span>
                            </h1>
                            <p className="text-slate-500 text-xl leading-relaxed">
                                Professional AI creative suite for TikTok, Reels & Shorts. Designed specifically for Indonesian affiliates.
                            </p>
                        </div>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xl shadow-slate-200">1</span>
                                <h3 className="text-xl font-bold text-slate-900">Choose Content Style</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                {CONTENT_STYLES.map(style => (
                                    <VibeCard key={style.id} vibe={style} isSelected={selectedStyle === style.id} onClick={setSelectedStyle} />
                                ))}
                            </div>
                        </section>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            <div className="lg:col-span-5 space-y-8">
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <span className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xl shadow-slate-200">2</span>
                                        <h3 className="text-xl font-bold text-slate-900">Campaign Brief</h3>
                                    </div>
                                    <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-xl shadow-slate-100/50 space-y-8">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Language</label>
                                                <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all appearance-none cursor-pointer">
                                                    {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Tone</label>
                                                <select value={selectedScriptStyle} onChange={(e) => setSelectedScriptStyle(e.target.value)} className="w-full bg-slate-50 border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none transition-all appearance-none cursor-pointer">
                                                    {SCRIPT_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Description</label>
                                            <textarea className="w-full h-48 p-5 bg-slate-50 border-slate-100 border rounded-3xl text-slate-900 focus:ring-8 focus:ring-indigo-50 focus:bg-white transition-all resize-none text-lg font-medium" placeholder="Describe the product or campaign goals..." value={description} onChange={(e) => setDescription(e.target.value)} />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <div className="lg:col-span-7 space-y-8">
                                <section className="space-y-6 flex flex-col h-full">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-xl shadow-slate-200">3</span>
                                            <h3 className="text-xl font-bold text-slate-900">Asset Studio</h3>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100/50 flex-1 flex flex-col overflow-hidden">
                                        <div className="flex border-b border-slate-50">
                                            <button onClick={() => setActiveAssetTab('primary')} className={`flex-1 flex items-center justify-center gap-2 py-6 text-[11px] font-extrabold transition-all border-b-4 uppercase tracking-widest ${activeAssetTab === 'primary' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                                <Layout size={18} /> Asset
                                            </button>
                                            {!isLocationMode && !isHandsOn && (
                                                <button onClick={() => setActiveAssetTab('character')} className={`flex-1 flex items-center justify-center gap-2 py-6 text-[11px] font-extrabold transition-all border-b-4 uppercase tracking-widest ${activeAssetTab === 'character' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                                    <User size={18} /> Model
                                                </button>
                                            )}
                                            {!isLocationMode && (
                                                <button onClick={() => setActiveAssetTab('environment')} className={`flex-1 flex items-center justify-center gap-2 py-6 text-[11px] font-extrabold transition-all border-b-4 uppercase tracking-widest ${activeAssetTab === 'environment' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/10' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                                    <MapPin size={18} /> Scene
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-8 flex-1">
                                            {activeAssetTab === 'primary' && (
                                                <UploadBox label={isLocationMode ? "Location Photos" : (isTreadmill ? "Fashion Items" : "Hero Product")} multiple={isLocationMode || isTreadmill} file={isLocationMode || isTreadmill ? null : uploadedFiles.product} files={isLocationMode ? uploadedFiles.locations : uploadedFiles.fashionItems} onChange={(f) => handleUpload(isLocationMode ? 'locations' : (isTreadmill ? 'fashionItems' : 'product'), f)} onRemove={() => handleRemove(isLocationMode ? 'locations' : (isTreadmill ? 'fashionItems' : 'product'))} className="h-full min-h-[300px]" />
                                            )}
                                            {activeAssetTab === 'character' && (
                                                <div className="h-full flex flex-col gap-6">
                                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl self-start">
                                                        <button onClick={() => setModelMode('upload')} className={`px-5 py-2 text-[10px] font-extrabold rounded-xl flex items-center gap-2 ${modelMode === 'upload' ? 'bg-white shadow-md text-slate-900' : 'text-slate-400'}`}><ImageIcon size={14}/> Photo</button>
                                                        <button onClick={() => setModelMode('prompt')} className={`px-5 py-2 text-[10px] font-extrabold rounded-xl flex items-center gap-2 ${modelMode === 'prompt' ? 'bg-white shadow-md text-slate-900' : 'text-slate-400'}`}><Type size={14}/> Prompt</button>
                                                    </div>
                                                    {modelMode === 'upload' ? <UploadBox label="Model Photo" file={uploadedFiles.model} onChange={(f) => handleUpload('model', [f[0]])} onRemove={() => handleRemove('model')} className="flex-1 min-h-[300px]" /> : <textarea value={modelPrompt} onChange={(e) => setModelPrompt(e.target.value)} placeholder="Describe your model..." className="flex-1 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none resize-none font-medium" />}
                                                </div>
                                            )}
                                            {activeAssetTab === 'environment' && (
                                                <div className="h-full flex flex-col gap-6">
                                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl self-start">
                                                        <button onClick={() => setBgMode('upload')} className={`px-5 py-2 text-[10px] font-extrabold rounded-xl flex items-center gap-2 ${bgMode === 'upload' ? 'bg-white shadow-md text-slate-900' : 'text-slate-400'}`}><ImageIcon size={14}/> Photo</button>
                                                        <button onClick={() => setBgMode('prompt')} className={`px-5 py-2 text-[10px] font-extrabold rounded-xl flex items-center gap-2 ${bgMode === 'prompt' ? 'bg-white shadow-md text-slate-900' : 'text-slate-400'}`}><Type size={14}/> Prompt</button>
                                                    </div>
                                                    {bgMode === 'upload' ? <UploadBox label="Background Photo" file={uploadedFiles.background} onChange={(f) => handleUpload('background', [f[0]])} onRemove={() => handleRemove('background')} className="flex-1 min-h-[300px]" /> : <textarea value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)} placeholder="Describe the scene..." className="flex-1 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none resize-none font-medium" />}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        <div className="pt-8 flex justify-center">
                            <button onClick={runGeneration} className="group relative bg-slate-900 hover:bg-black text-white text-2xl font-black py-6 px-20 rounded-[2rem] shadow-2xl hover:-translate-y-2 transition-all duration-500 flex items-center gap-6">
                                <Sparkles className="text-indigo-400" />
                                Launch Campaign
                                <ChevronRight />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-700 space-y-12">
                        <div className="flex items-center justify-between">
                            <button onClick={() => setGeneratedContent(null)} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 font-bold uppercase tracking-widest text-[11px]"><ArrowLeft size={16}/> Return to Editor</button>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Campaign Output</h2>
                            <button onClick={() => setGeneratedContent(null)} className="px-8 py-3 font-bold text-slate-600 bg-white border border-slate-200 rounded-2xl shadow-sm hover:bg-indigo-50 transition-all"><Settings2 size={20}/></button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-7 space-y-8">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    {generatedContent.images.map((img, idx) => (
                                        <StoryCard key={idx} idx={idx} imgBase64={img} sceneDescription={generatedContent.sceneDescriptions?.[idx] || "Scene Visual"} prompts={generatedContent.platformPrompts?.[idx] || {}} />
                                    ))}
                                </div>
                                <button onClick={downloadImages} className="w-full bg-white border border-slate-200 hover:bg-indigo-50 text-slate-900 font-black py-6 rounded-3xl shadow-sm flex items-center justify-center gap-4 transition-all"><Images size={24} className="text-indigo-600" /> Download ZIP Archive</button>
                            </div>

                            <div className="lg:col-span-5 flex flex-col gap-8">
                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-100 flex-1 flex flex-col overflow-hidden">
                                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                        <div className="flex items-center gap-3 text-slate-900 font-black tracking-tight text-xl"><FileText size={24} className="text-indigo-600" /> SCRIPT</div>
                                        <div className="flex items-center gap-3">
                                            <select value={activeAudioVoice} onChange={(e) => { setActiveAudioVoice(e.target.value); setAudioUrl(null); }} className="px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold cursor-pointer">
                                                {TTS_VOICES.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                                            </select>
                                            <button onClick={generateAudio} disabled={!!audioUrl} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg disabled:opacity-50">AUDIO</button>
                                        </div>
                                    </div>

                                    {audioUrl && (
                                        <div className="p-8 bg-indigo-600 text-white flex items-center gap-6 animate-in slide-in-from-top-4 duration-500">
                                            <button onClick={togglePlay} className="w-16 h-16 flex items-center justify-center bg-white rounded-full text-indigo-600 shadow-2xl transition-all active:scale-95">
                                                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                                            </button>
                                            <div className="flex-1"><div className="h-1.5 bg-indigo-400/30 rounded-full overflow-hidden"><div className={`h-full bg-white ${isPlaying ? 'w-full animate-pulse' : 'w-0'}`}></div></div></div>
                                            <audio ref={audioRef} src={audioUrl} className="hidden" />
                                        </div>
                                    )}

                                    <div className="p-8 space-y-8 overflow-y-auto max-h-[600px]">
                                        <textarea value={editableScript} onChange={(e) => setEditableScript(e.target.value)} className="w-full h-80 text-xl text-slate-700 leading-relaxed bg-transparent border-0 outline-none resize-none font-medium" />
                                        <div className="pt-8 border-t border-slate-100 space-y-4">
                                            <div className="flex flex-wrap gap-3">
                                                {generatedContent.tiktokMetadata?.keywords?.map((tag, i) => (
                                                    <span key={i} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-2xl">#{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={downloadDoc} className="bg-slate-900 hover:bg-black text-white font-black py-6 rounded-[2rem] shadow-xl flex items-center justify-center gap-4 transition-all">
                                        <FileDown size={24} /> DOCX
                                    </button>
                                    <button onClick={() => navigator.clipboard.writeText(editableScript)} className="bg-white border border-slate-200 text-slate-900 font-black py-6 rounded-[2rem] shadow-sm hover:bg-indigo-50 flex items-center justify-center gap-4 transition-all">
                                        <Copy size={24} /> COPY
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-4 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
                    <Zap size={20} />
                    <span className="font-extrabold text-xl tracking-tighter">TASME<span className="text-indigo-600">INDONESIA</span></span>
                </div>
                <div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">
                    Professional AI Video Suite © 2025 by Tasme Indonesia
                </div>
            </footer>
        </div>
    );
}
