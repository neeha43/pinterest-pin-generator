import React, { useState, useRef } from 'react';
import { Upload, Type, Sparkles, Image as ImageIcon, Download, Loader2, X, Film, AlertCircle, Key } from 'lucide-react';
import { editImageWithTextOverlay, generateTextAnimationVideo } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { User, GeneratedImage } from '../types';

interface TextOverlayToolProps {
  user: User | null;
  onImageSaved?: () => void;
}

const TextOverlayTool: React.FC<TextOverlayToolProps> = ({ user, onImageSaved }) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [styling, setStyling] = useState('Modern, bold typography, high contrast, suitable for social media');
  
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'static' | 'video'>('static');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("Image size too large. Please upload an image under 4MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSourceImage(result);
        setGeneratedImage(null);
        setGeneratedVideo(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setSourceImage(event.target?.result as string);
          setGeneratedImage(null);
          setGeneratedVideo(null);
          setError(null);
        };
        reader.readAsDataURL(file);
    }
  };

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
    if (!sourceImage || !text.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedVideo(null);

    try {
      // Remove data URL prefix for API
      const base64Data = sourceImage.split(',')[1];
      
      if (mode === 'static') {
        const resultBase64 = await editImageWithTextOverlay(base64Data, text, styling);
        setGeneratedImage(resultBase64);

        if (user) {
            const newImage: GeneratedImage = {
            id: `overlay-${Date.now()}`,
            base64: resultBase64,
            prompt: `Text overlay: "${text}" - ${styling}`,
            style: 'Text Overlay',
            model: 'gemini-2.5-flash-image',
            createdAt: Date.now()
            };
            await storageService.saveImage(user.id, newImage);
            if (onImageSaved) onImageSaved();
        }
      } else {
         // Video Mode
         // Check for key
         if (window.aistudio) {
             try {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                if (!hasKey) await window.aistudio.openSelectKey();
             } catch (e) {
                console.error("Key selection error", e);
             }
         }

         const videoUrl = await generateTextAnimationVideo(base64Data, text, styling);
         setGeneratedVideo(videoUrl);
      }

    } catch (err: any) {
      console.error(err);
      let msg = "Failed to generate.";
      
      const errMsg = err.message || err.error?.message || JSON.stringify(err);

      if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
        msg = "Rate limit exceeded. Please try again in a moment.";
      } else if (errMsg.includes("Requested entity was not found") || errMsg.includes("404") || errMsg.includes("NOT_FOUND")) {
         msg = "API Key issue or Model not found. Please select your key again.";
         // Trigger key selection automatically
         if (window.aistudio) {
             try { await window.aistudio.openSelectKey(); } catch (e) {}
         }
      } else if (errMsg.includes("SAFETY")) {
         msg = "Generation blocked by safety settings.";
      } else if (err.message) {
         msg = err.message;
      }
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">AI Text Overlay & Animation</h2>
        <p className="text-slate-500">Add professional text to your images or animate them with Veo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 flex flex-col gap-6">
           
           {/* Mode Selection */}
           <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMode('static')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    mode === 'static' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                 <ImageIcon className="w-4 h-4" />
                 Static Image
              </button>
              <button
                onClick={() => setMode('video')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    mode === 'video' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                 <Film className="w-4 h-4" />
                 Animated Video
              </button>
           </div>

           {/* Image Upload */}
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Source Image
             </label>
             
             {!sourceImage ? (
               <div 
                 onDragOver={(e) => e.preventDefault()}
                 onDrop={handleDrop}
                 onClick={() => fileInputRef.current?.click()}
                 className="border-2 border-dashed border-slate-300 rounded-2xl h-56 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors group"
               >
                 <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:text-red-500 mb-3 transition-colors">
                    <Upload className="w-6 h-6" />
                 </div>
                 <p className="text-slate-600 font-medium">Click to upload or drag & drop</p>
                 <p className="text-xs text-slate-400 mt-1">PNG, JPG (Max 4MB)</p>
               </div>
             ) : (
               <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-56 flex items-center justify-center group">
                 <img src={sourceImage} alt="Source" className="max-h-full max-w-full object-contain" />
                 <button 
                   onClick={() => setSourceImage(null)}
                   className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                 >
                   <X className="w-4 h-4" />
                 </button>
               </div>
             )}
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*"
               onChange={handleFileChange}
             />
           </div>

           {/* Text Inputs */}
           <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Text to Add
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. Summer Sale 50% Off"
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {mode === 'static' ? 'Styling & Context' : 'Animation Style & Mood'}
                </label>
                <textarea
                  value={styling}
                  onChange={(e) => setStyling(e.target.value)}
                  placeholder={mode === 'static' 
                    ? "Describe how the text should look (e.g. Neon glowing letters, Elegant gold script)" 
                    : "Describe the animation style (e.g. Cinematic fade in, energetic pop-up, elegant slide)"}
                  rows={2}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                />
              </div>
           </div>
           
           {mode === 'video' && (
              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex items-start gap-2">
                 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                 <span>Video generation (Veo) can take 1-2 minutes. Please be patient. You will need to select a paid project API key.</span>
              </div>
           )}

           <button
             onClick={handleGenerate}
             disabled={!sourceImage || !text.trim() || isGenerating}
             className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
               !sourceImage || !text.trim() || isGenerating
               ? 'bg-slate-300 cursor-not-allowed'
               : 'bg-red-600 hover:bg-red-700 shadow-lg'
             }`}
           >
             {isGenerating ? (
               <>
                 <Loader2 className="w-5 h-5 animate-spin" />
                 {mode === 'video' ? 'Generating Video...' : 'Processing...'}
               </>
             ) : (
               <>
                 {mode === 'video' ? <Film className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                 {mode === 'video' ? 'Generate Video' : 'Generate Overlay'}
               </>
             )}
           </button>
           
           {error && (
             <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex flex-col items-center gap-2">
               <span className="text-center">{error}</span>
               {(error.includes('API Key') || error.includes('Model not found') || error.includes('Permission')) && window.aistudio && (
                 <button 
                    onClick={handleSelectKey}
                    className="mt-1 px-4 py-2 bg-red-600 text-white rounded-full text-xs font-bold hover:bg-red-700 flex items-center gap-2"
                 >
                    <Key className="w-3 h-3" />
                    Select API Key
                 </button>
               )}
             </div>
           )}
        </div>

        {/* Right Column: Result */}
        <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 md:p-8 flex items-center justify-center min-h-[400px]">
           {isGenerating ? (
              <div className="text-center">
                  <Loader2 className="w-10 h-10 text-red-600 animate-spin mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">Creating your {mode === 'video' ? 'animation' : 'image'}...</p>
                  {mode === 'video' && <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">This may take a minute or two using Veo.</p>}
              </div>
           ) : generatedImage ? (
             <div className="relative group w-full h-full flex items-center justify-center">
                <img 
                  src={`data:image/png;base64,${generatedImage}`} 
                  alt="Generated Result" 
                  className="max-h-[500px] w-auto object-contain rounded-xl shadow-md"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-end p-4">
                   <a 
                    href={`data:image/png;base64,${generatedImage}`} 
                    download="text-overlay-result.png"
                    className="bg-white text-slate-900 px-4 py-2 rounded-full font-medium shadow-lg flex items-center gap-2 hover:scale-105 transition-transform opacity-0 group-hover:opacity-100"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
             </div>
           ) : generatedVideo ? (
             <div className="relative w-full h-full flex flex-col items-center justify-center">
                <video 
                  src={generatedVideo} 
                  controls 
                  className="max-h-[500px] w-full object-contain rounded-xl shadow-md bg-black"
                  playsInline
                />
                 <div className="mt-4">
                   <a 
                    href={generatedVideo}
                    download="text-animation.mp4"
                    className="bg-white text-slate-900 px-4 py-2 rounded-full font-medium shadow-sm border border-slate-200 flex items-center gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Video
                  </a>
                </div>
             </div>
           ) : (
             <div className="text-center text-slate-400">
               <div className="w-20 h-20 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center border-2 border-dashed border-slate-300">
                 {mode === 'video' ? <Film className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
               </div>
               <p>Your generated {mode === 'video' ? 'video' : 'image'} will appear here</p>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default TextOverlayTool;