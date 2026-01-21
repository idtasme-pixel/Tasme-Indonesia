
import { GoogleGenAI } from "@google/genai";
import { STORY_FLOWS } from '../constants';
import { UploadedFilesState } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const buildCreativePlanPayload = (style: string, lang: string, description: string, scriptStyle: string, fileCount: number, hasUserBackground: boolean) => {
    let shotStructure = "";
    
    if (style === 'treadmill_fashion_show') {
        shotStructure = `${fileCount} SHOTS LOOPING. 
        KONSEP: Model berjalan di Walking Pad (Treadmill) menghadap kamera (Front View).
        SETIAP SHOT adalah looping yang sama, dengan model yang sama dan background yang sama, HANYA BAJU YANG BERUBAH sesuai urutan input.`;
    } else if (style === 'property') {
        shotStructure = `${fileCount} SHOTS URUTAN LOKASI. 
        Setiap shot merepresentasikan satu foto lokasi yang diupload user secara berurutan.`;
    } else {
        const flow = STORY_FLOWS[style] || [];
        shotStructure = `${fileCount} SHOTS WAJIB (${flow.map(s => s.label).join(', ')})`;
        
        if (style === 'direct') {
            shotStructure += `\nIMPORTANT: Mode ini adalah "PRESENTER STORY" (UGC).`;
            
            if (hasUserBackground) {
                 shotStructure += `\n
                 ATURAN BACKGROUND (USER PROVIDED):
                 - User telah memberikan referensi Background.
                 - **WAJIB KONSISTEN**: Gunakan deskripsi background yang SAMA PERSIS untuk Shot 1 sampai Shot ${fileCount}.
                 `;
            } else {
                 shotStructure += `\n
                 ATURAN BACKGROUND (DYNAMIC):
                 - Pertahankan background yang KONSISTEN (misal: di satu sudut kamar aesthetic) agar fokus pada produk.
                 `;
            }

            shotStructure += `\n
            ATURAN VISUAL KRUSIAL:
            1. **SMART DEMOGRAPHIC ANALYSIS**:
               - Produk Anak = Model Ibu & Anak / Anak.
               - Produk Dewasa = Model Dewasa.
            `;
        }
    }

    let userQuery = `
        Deskripsi User: "${description || "Tidak ada deskripsi"}"
        Bahasa Naskah: ${lang}
        Gaya Naskah: ${scriptStyle}
        Gaya Konten: ${style}
        
        STRUKTUR VISUAL WAJIB:
        ${shotStructure}
        (Pastikan output memiliki TEPAT ${fileCount} item.)

        Durasi Script: WAJIB TEPAT ${(fileCount * 8)} DETIK TOTAL.
        
        TUGAS TAMBAHAN:
        Untuk SETIAP SHOT, buatlah 3 variasi prompt video di dalam objek 'platformPrompts' (dreamina, leonardo, other).
        
        Tugas: Hasilkan JSON rencana kreatif.
    `;
    
    const baseSystemInstruction = `
        Anda adalah AI Creative Director untuk TASME INDONESIA (Aplikasi Konten Kreator Profesional).
        
        TUGAS UTAMA: MENGHASILKAN VISUAL YANG LOGIS & KONSISTEN (CONSISTENCY IS KING).

        1. **LOCK CHARACTER IDENTITY**:
           - Tentukan detail fisik Subjek Utama.
           - **WARNA BAJU & GAYA RAMBUT TIDAK BOLEH BERUBAH** antar shot (KECUALI user upload banyak baju beda).

        2. **ENVIRONMENTAL CONSISTENCY**:
           - Jika User mengupload Background, **JANGAN UBAH LOKASI ITU**.
        
        3. **JUMLAH SHOT**:
           - Hasilkan TEPAT ${fileCount} SHOT.

        OUTPUT JSON:
        { 
            "tiktokScript": "...", 
            "shotPrompts": ["Prompt Shot 1", ...], 
            "platformPrompts": [ ... ],
            "tiktokMetadata": { "keywords": [], "description": "" }, 
            "sceneDescriptions": [] 
        }
    `;

    return { 
        systemInstruction: baseSystemInstruction, 
        userQuery
    };
};

export const GeminiService = {
    getCreativePlan: async (style: string, files: UploadedFilesState, description: string, language: string, scriptStyle: string) => {
        let dynamicCount = 5;
        
        if (style === 'treadmill_fashion_show') {
            dynamicCount = files.fashionItems.length;
        } else if (style === 'property') {
            dynamicCount = files.locations.length;
        } else {
            const flow = STORY_FLOWS[style];
            if (flow) dynamicCount = flow.length;
        }

        const isLocationMode = style === 'property';
        const isTreadmill = style === 'treadmill_fashion_show';
        const isHandsOn = style === 'aesthetic_hands_on';
        
        const hasUserBackground = !!files.background || (description.toLowerCase().includes('background') || description.toLowerCase().includes('latar'));

        const imageParts: any[] = [];
        
        if (isLocationMode) {
            files.locations.forEach(f => imageParts.push({ inlineData: { mimeType: f.type, data: f.data } }));
        } else if (isTreadmill) {
            files.fashionItems.forEach(f => imageParts.push({ inlineData: { mimeType: f.type, data: f.data } }));
            if (files.model) imageParts.push({ inlineData: { mimeType: files.model.type, data: files.model.data }}); 
            if (files.background) imageParts.push({ inlineData: { mimeType: files.background.type, data: files.background.data }});
        } else if (isHandsOn) {
            if (files.product) imageParts.push({ inlineData: { mimeType: files.product.type, data: files.product.data }});
            if (files.background) imageParts.push({ inlineData: { mimeType: files.background.type, data: files.background.data }});
        } else {
            if (files.product) imageParts.push({ inlineData: { mimeType: files.product.type, data: files.product.data }});
            if (files.model) imageParts.push({ inlineData: { mimeType: files.model.type, data: files.model.data }});
            if (files.background) imageParts.push({ inlineData: { mimeType: files.background.type, data: files.background.data }});
            if (style === 'food_promo') files.locations.forEach(f => imageParts.push({ inlineData: { mimeType: f.type, data: f.data } }));
        }

        const { systemInstruction, userQuery } = buildCreativePlanPayload(style, language, description, scriptStyle, dynamicCount, hasUserBackground);

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: userQuery }, ...imageParts] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Gagal menghasilkan rencana konten.");
        }
        
        const parsedData = JSON.parse(text.replace(/```json|```/g, "").trim());
        return parsedData;
    },

    generateImage: async (prompt: string, activeFiles: any[], style: string, extraContext?: { model?: string, background?: string }) => {
        let specificPromptAddon = "";
        
        if (style === 'aesthetic_hands_on') {
            specificPromptAddon = "POV shot, only hands visible, elegant hand gestures, no face, shallow depth of field, focus on product texture.";
        } else if (style === 'treadmill_fashion_show') {
            specificPromptAddon = "Full body shot, model walking on walking pad treadmill facing camera (front view), fashion runway style.";
        } else if (style === 'direct') {
            specificPromptAddon = "UGC Style. MANDATORY: HUMAN PRESENTER MUST BE VISIBLE. Ensure Subject Identity continuity.";
        }
        
        const fixedIdentityBlock = extraContext?.model 
            ? `LOCKED CHARACTER IDENTITY: ${extraContext.model}.`
            : "INSTRUCTION: CHARACTER CONSISTENCY IS CRITICAL.";

        const fixedLocationBlock = extraContext?.background
            ? `LOCKED LOCATION IDENTITY: ${extraContext.background}.`
            : "INSTRUCTION: KEEP LOCATION CONSISTENT.";

        const strongPrompt = `
            SYSTEM INSTRUCTION: INTELLIGENT COMPOSITOR & CONSISTENCY GUARDIAN for TASME INDONESIA.
            
            ${fixedIdentityBlock}
            ${fixedLocationBlock}

            REFERENCE INTEGRITY:
            - Maintain the product's color, shape, logo, and packaging details precisely.
            
            FULL SCENE DESCRIPTION:
            ${prompt}
            
            STYLE & QUALITY:
            ${specificPromptAddon}
            - Photorealistic, 8k, raw photo style, natural lighting.
        `;
        
        const imageParts = activeFiles.map(f => ({ inlineData: { mimeType: f.type, data: f.data } }));
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: strongPrompt }, ...imageParts] },
            config: {
                imageConfig: { aspectRatio: "9:16" }
            }
        });

        let b64;
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    b64 = part.inlineData.data;
                    break;
                }
            }
        }
        
        if (!b64) throw new Error("Gagal generate gambar.");
        return b64;
    },

    generateTTS: async (text: string, voice: string) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: { parts: [{ text }] },
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice }
                    }
                }
            }
        });

        let b64;
        if (response.candidates?.[0]?.content?.parts) {
             for (const part of response.candidates[0].content.parts) {
                 if (part.inlineData) {
                     b64 = part.inlineData.data;
                     break;
                 }
             }
        }
        if (!b64) throw new Error("Gagal generate audio.");
        return b64;
    }
};
