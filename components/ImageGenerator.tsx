import React, { useState } from 'react';
import { Sparkles, Download, Image as ImageIcon, Loader2, Settings2, Key } from 'lucide-react';
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
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash (Fast)' },
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
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    
    // Check key for Pro model
    if (model === 'gemini-3-pro-image-preview') {
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
    setGeneratedImage(null);

    try {
      const base64 = await generateImageFromPrompt(prompt, style, model);
      if (base64) {
        setGeneratedImage(base64);
        
        // Save to storage if user is logged in
        if (user) {
          const newImage: GeneratedImage = {
            id: `img-${Date.now()}`,
            base64,
            prompt,
            style,
            model,
            createdAt: Date.now()
          };
          storageService.saveImage(user.id, newImage);
          if (onImageSaved) onImageSaved();
        }

      } else {
        setError("Could not generate image. Please try again or check your API key.");
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes('403') || err.message.includes('PERMISSION_DENIED'))) {
        setError("Permission denied. The selected model requires a paid API key or appropriate permissions.");
      } else {
        setError("An error occurred while generating the image.");
      }
    } finally {
      setIsLoading(false);
    }
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
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Image
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
          {error.includes('Permission denied') && window.aistudio && (
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

      {(generatedImage || isLoading) && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col items-center">
           <div className="aspect-square w-full max-w-lg bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center relative group">
              {isLoading ? (
                <div className="text-center">
                   <Loader2 className="w-10 h-10 text-red-600 animate-spin mx-auto mb-4" />
                   <p className="text-slate-500 font-medium">Creating your masterpiece...</p>
                   <p className="text-xs text-slate-400 mt-2">Using {MODELS.find(m => m.id === model)?.name}</p>
                </div>
              ) : generatedImage ? (
                <>
                   <img 
                      src={`data:image/png;base64,${generatedImage}`} 
                      alt="AI Generated" 
                      className="w-full h-full object-cover"
                    />
                    <a 
                      href={`data:image/png;base64,${generatedImage}`} 
                      download="ai-generated-image.png"
                      className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-slate-900 px-4 py-2 rounded-full font-medium shadow-lg flex items-center gap-2 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                </>
              ) : null}
           </div>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;