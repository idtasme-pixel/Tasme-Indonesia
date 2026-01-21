import React from 'react';
import { 
  User, Repeat, Home, Hand, Utensils, 
  Video, Sparkles, Settings 
} from 'lucide-react';
import { ContentStyle } from './types';

export const CONTENT_STYLES: ContentStyle[] = [
    { id: 'direct', name: 'Presenter Story', icon: <User size={20} /> },
    { id: 'treadmill_fashion_show', name: 'Treadmill Loop', icon: <Repeat size={20} /> },
    { id: 'property', name: 'Promo Properti', icon: <Home size={20} /> },
    { id: 'aesthetic_hands_on', name: 'Aesthetic Hands', icon: <Hand size={20} /> },
    { id: 'food_promo', name: 'Food Promo', icon: <Utensils size={20} /> },
];

export const LANGUAGES = [
    { id: 'id-ID', label: 'Bahasa Indonesia (Default)' },
    { id: 'en-US', label: 'English' },
    { id: 'ms-MY', label: 'Bahasa Melayu' },
];

export const SCRIPT_STYLES = [
    { id: 'clear', label: 'Jelas & To-the-Point (Default)' },
    { id: 'poetic', label: 'Puitis & Sinematik' },
    { id: 'absurd', label: 'Absurd & Lucu' },
    { id: 'ugc', label: 'UGC / Santai (Teman Curhat)' },
    { id: 'luxury', label: 'Mewah & Elegan' },
];

export const PROMPT_PLATFORMS = [
    { id: 'dreamina', label: 'Dreamina', url: 'https://dreamina.capcut.com/ai-tool/home', color: 'bg-blue-600 hover:bg-blue-700', text: 'text-blue-600', border: 'border-blue-200', bg: 'bg-blue-50', icon: <Video size={14}/> },
    { id: 'leonardo', label: 'Leonardo AI', url: 'https://leonardo.ai/', color: 'bg-purple-600 hover:bg-purple-700', text: 'text-purple-600', border: 'border-purple-200', bg: 'bg-purple-50', icon: <Sparkles size={14}/> },
    { id: 'other', label: 'Lainnya (+Script)', url: null, color: 'bg-gray-800 hover:bg-gray-900', text: 'text-gray-600', border: 'border-gray-200', bg: 'bg-gray-50', icon: <Settings size={14}/> },
];

export const TTS_VOICES = [
    { value: "Fenrir", label: "Pria (Tegas/Berat)" }, 
    { value: "Puck", label: "Pria (Ceria)" },
    { value: "Gacrux", label: "Pria (Dewasa/Dalam)" },
    { value: "Orus", label: "Pria (Natural)" },
    { value: "Leda", label: "Wanita (Ceria/Muda)" },
    { value: "Kore", label: "Wanita (Tenang/Jelas)" },
    { value: "Aoede", label: "Wanita (Elegan/Ringan)" },
    { value: "Sulafat", label: "Wanita (Hangat)" },
];

export const STORY_FLOWS: Record<string, {id: string, label: string}[]> = {
    direct: [
        { id: "hook", label: "SHOT 1: HOOK (Jembreng/Pegang)" },
        { id: "demo", label: "SHOT 2: THE DEMO (Pakai)" },
        { id: "result", label: "SHOT 3: THE RESULT (Face)" },
        { id: "texture", label: "SHOT 4: TEXTURE/DETAIL" },
        { id: "cta", label: "SHOT 5: CTA (Face)" }
    ],
    aesthetic_hands_on: [
        { id: 'pov', label: 'SHOT 1: POV Memegang Produk' },
        { id: 'detail', label: 'SHOT 2: Detail Fisik Produk' },
        { id: 'swatch', label: 'SHOT 3: Swatch/Pakai di Tangan' },
        { id: 'table', label: 'SHOT 4: Produk Ditaruh di Meja' },
        { id: 'full', label: 'SHOT 5: Full Shot Produk' }
    ],
    food_promo: [
        { id: 'hook', label: 'SHOT 1: Intro' },
        { id: 'reveal', label: 'SHOT 2: Reveal' },
        { id: 'action', label: 'SHOT 3: Bite' },
        { id: 'reaction', label: 'SHOT 4: Reaction' },
        { id: 'cta', label: 'SHOT 5: CTA' }
    ]
};