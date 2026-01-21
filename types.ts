import { ReactNode } from 'react';

declare global {
    interface Window {
        JSZip: any;
        webkitAudioContext: typeof AudioContext;
    }
}

export interface UploadedFile {
    name: string;
    type: string;
    size: number;
    data: string; // base64 string without prefix
    previewUrl: string; // full base64 string for img src
}

export interface ContentStyle {
    id: string;
    name: string;
    icon: ReactNode;
}

export interface PlatformPrompt {
    dreamina?: string;
    leonardo?: string;
    other?: string;
    [key: string]: string | undefined;
}

export interface GeneratedContent {
    tiktokScript: string;
    shotPrompts: string[];
    platformPrompts: PlatformPrompt[];
    tiktokMetadata: {
        keywords: string[];
        description: string;
    };
    sceneDescriptions: string[];
    images: string[];
}

export interface UploadedFilesState {
    product: UploadedFile | null;
    model: UploadedFile | null;
    locations: UploadedFile[];
    fashionItems: UploadedFile[];
    background: UploadedFile | null;
}
