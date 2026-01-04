import React, { useState } from 'react';
import { Sparkles, Download, Image as ImageIcon, Loader2, Settings2, Key, RefreshCw, Lock, Grid } from 'lucide-react';
import { generateImageFromPrompt } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { User, GeneratedImage } from '../types';

const STYLES = [
  'None',
  'Photorealistic',
  'Cinematic',
  '3D Render',
  'Anime',
  'Watercolor',
  'Oil Painting',
  'Cyberpunk',
  'Minimalist Line Art',
  'Vintage/Retro',
  'Pixel Art'
];

const MODELS = [
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash (Fast & Efficient)' },
  { id: 'imagen-3.0-generate-001', name: 'Imagen 3 (Photorealistic)' },
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3.0 Pro (High Quality)' }
];

interface ImageGeneratorProps {
  user: User | null;
  onImageSaved?: () => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ user, onImageSaved }) => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('None');
  const [model, setModel] = useState('gemini-2.5-flash-image');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{base64: string, seed: number | undefined}[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [numberOfImages, setNumberOfImages] = useState(1);
  
  // Consistency State
  const [useConsistentStyle, setUseConsistentStyle] = useState(false);
  const [consistencySeed, setConsistencySeed] = useState<number | null>(null);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setError(null);
      } catch (e) {
        console.error("Failed to select key", e);
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // Check key for paid/preview models
    if (model === 'gemini-3-pro-image-preview' || model.startsWith('imagen')) {
      if (window.aistudio) {
         try {
           const hasKey = await window.aistudio.hasSelectedApiKey();
           if (!hasKey) {
             await window.aistudio.openSelectKey();
           }
         } catch(e) {
           console.error("Key check failed", e);
         }
      }
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    // Determine Base Seed
    let baseSeed: number | undefined = undefined;
    if (useConsistentStyle) {
      if (consistencySeed === null) {
        const newSeed = Math.floor(Math.random() * 2147483647);
        setConsistencySeed(newSeed);
        baseSeed = newSeed;
      } else {
        baseSeed = consistencySeed;
      }
    } else {
      if (consistencySeed !== null) setConsistencySeed(null);
    }

    try {
      const results: { base64: string, seed: number | undefined, success: boolean, error?: any }[] = [];

      // Execute sequentially to avoid 429 Rate Limits
      for (let i = 0; i < numberOfImages; i++) {
        // If consistency is on, we use baseSeed + index to ensure variations within the batch 
        // but determinism across regenerations.
        // If off, we leave seed undefined (random).
        const seed = baseSeed !== undefined ? baseSeed + i : undefined;
        
        try {
          const base64 = await generateImageFromPrompt(prompt, style, model, seed);
          results.push({ base64, seed, success: true });
        } catch (e: any) {
          console.error(`Generation failed for image ${i + 1}`, e);
          results.push({ base64: '', seed, success: false, error: e });
          
          // If we hit a critical rate limit error, abort remaining generations to avoid cascading failures
          const errStr = e.message || JSON.stringify(e);
          if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
            break;
          }
        }

        // Add a delay between requests if there are more to come, to respect rate limits
        if (i < numberOfImages - 1) {
             await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      const successfulImages = results
        .filter(r => r.success && r.base64)
        .map(r => ({ base64: r.base64, seed: r.seed }));

      if (successfulImages.length > 0) {
        setGeneratedImages(successfulImages);
        
        // Save to storage if user is logged in
        if (user) {
          const savePromises = successfulImages.map(img => {
             const newImage: GeneratedImage = {
              id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              base64: img.base64,
              prompt,
              style,
              model,
              seed: img.seed,
              createdAt: Date.now()
            };
            return storageService.saveImage(user.id, newImage);
          });
          
          await Promise.all(savePromises);
          if (onImageSaved) onImageSaved();
        }
        
        // If some failed but some succeeded, warn user
        if (successfulImages.length < numberOfImages) {
             const failedCount = numberOfImages - successfulImages.length;
             // Optional: Set a non-blocking warning or just log it. 
             // We can use the error state but usually that hides results.
             // For now, we show results.
        }

      } else {
        // Look for specific errors in the failures
        const firstError: any = results.find(r => !r.success)?.error;
        let errorMessage = "Could not generate images.";
        
        if (firstError) {
           // Parse potential error structures
           const errString = JSON.stringify(firstError);
           const errMsg = firstError.message || firstError.error?.message || errString;

           if (errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED')) {
             errorMessage = "Permission denied. The selected model requires a paid API key or appropriate permissions.";
           } else if (errMsg.includes('Requested entity was not found') || errMsg.includes('404') || errMsg.includes('NOT_FOUND')) {
             errorMessage = "API Key issue or Model not found. Please select your key again.";
             // Trigger key selection if possible
             if (window.aistudio) {
                try { await window.aistudio.openSelectKey(); } catch (e) {}
             }
           } else if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
             errorMessage = "Rate limit exceeded. Please wait a moment before trying again or reduce the number of images.";
           } else if (firstError.message) {
             errorMessage = firstError.message;
           }
        }
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetConsistency = () => {
    const newSeed = Math.floor(Math.random() * 2147483647);
    setConsistencySeed(newSeed);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">AI Image Generator</h2>
        <p className="text-slate-500">Turn your ideas into visuals with a simple text prompt.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-slate-50 cursor-pointer"
              >
                {MODELS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Style Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Art Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-slate-50 cursor-pointer"
              >
                {STYLES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 mb-2">
              Describe the image you want to create
            </label>
            <textarea
              id="prompt"
              rows={4}
              className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              placeholder="e.g., A minimalist workspace with a laptop, coffee cup, and a small succulent plant, soft morning lighting..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Configuration Bar */}
          <div className="flex flex-col md:flex-row gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
             
             {/* Number of Images */}
             <div className="flex-1 flex flex-col justify-center">
                <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Grid className="w-4 h-4" />
                  Number of Images
                </label>
                <div className="flex bg-white rounded-lg border border-slate-200 p-1 w-fit">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => setNumberOfImages(num)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                        numberOfImages === num 
                        ? 'bg-slate-900 text-white shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
             </div>

             <div className="w-px bg-slate-200 hidden md:block"></div>

             {/* Consistency Toggle */}
             <div className="flex-1 flex flex-col justify-center">
                 <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                       <Lock className="w-4 h-4" />
                       Consistent Style
                    </label>
                    {useConsistentStyle && (
                        <button 
                          onClick={resetConsistency}
                          className="text-[10px] font-medium text-red-600 hover:text-red-700 flex items-center gap-1 bg-white border border-red-100 px-2 py-0.5 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          New Seed
                        </button>
                    )}
                 </div>
                 
                 <div className="flex items-center gap-3">
                     <button 
                        type="button"
                        onClick={() => setUseConsistentStyle(!useConsistentStyle)}
                        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${useConsistentStyle ? 'bg-red-600' : 'bg-slate-300'}`}
                     >
                        <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${useConsistentStyle ? 'translate-x-5' : 'translate-x-0'}`} />
                     </button>
                     <span className="text-xs text-slate-500">
                       {useConsistentStyle ? "Using fixed seed" : "Random seed each time"}
                     </span>
                 </div>
             </div>
          </div>
          
          <div className="flex justify-end">
             <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className={`px-8 py-3 rounded-xl font-bold text-white flex items-center gap-2 transition-all ${
                isLoading || !prompt.trim()
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating {numberOfImages > 1 ? `${numberOfImages} images` : ''}...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate {numberOfImages > 1 ? `${numberOfImages} Images` : 'Image'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result Area */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-center flex flex-col items-center gap-2">
          <span>{error}</span>
          {(error.includes('Permission denied') || error.includes('API Key')) && window.aistudio && (
             <button 
                onClick={handleSelectKey}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 flex items-center gap-2"
             >
                <Key className="w-4 h-4" />
                Select API Key
             </button>
          )}
          {error.includes('Permission denied') && (
            <div className="text-xs text-slate-500 mt-2">
               Please ensure you are using a paid API Key or have the necessary permissions enabled in your Google Cloud project. <br/>
               <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline hover:text-slate-800">Learn more about billing</a>
            </div>
          )}
        </div>
      )}

      {(generatedImages.length > 0 || isLoading) && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8">
           {isLoading && generatedImages.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12">
                 <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
                 <p className="text-slate-500 font-medium">Creating your {numberOfImages > 1 ? 'masterpieces' : 'masterpiece'}...</p>
                 <p className="text-xs text-slate-400 mt-2">Using {MODELS.find(m => m.id === model)?.name}</p>
                 {useConsistentStyle && <p className="text-xs text-red-400 mt-1 font-mono">Base Seed: {consistencySeed}</p>}
             </div>
           ) : (
             <div className={`grid gap-6 ${generatedImages.length === 1 ? 'grid-cols-1 max-w-lg mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
                {generatedImages.map((img, idx) => (
                  <div key={idx} className="group relative">
                    <div className="aspect-square w-full bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                        <img 
                          src={`data:image/png;base64,${img.base64}`} 
                          alt={`AI Generated ${idx + 1}`} 
                          className="w-full h-full object-cover"
                        />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-end p-4 opacity-0 group-hover:opacity-100">
                           <a 
                            href={`data:image/png;base64,${img.base64}`} 
                            download={`ai-generated-${idx}.png`}
                            className="bg-white text-slate-900 px-4 py-2 rounded-full font-medium shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                         </div>
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;