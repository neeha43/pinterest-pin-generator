import React, { useState } from 'react';
import { Sparkles, Copy, RefreshCw, Wand2, Download, Check, Quote, Image as ImageIcon } from 'lucide-react';
import { generateQuotes, generateImageFromPrompt } from '../services/geminiService';
import { User } from '../types';
import { storageService } from '../services/storageService';

const METAPHORS = ['River', 'Mountain', 'Tree', 'Sun', 'Wind', 'Ocean', 'Flame', 'Flower', 'Seed', 'Stars', 'Storm', 'Desert', 'Rain'];
const VIRTUES = ['Patience', 'Kindness', 'Mindfulness', 'Positivity', 'Clarity', 'Love', 'Forgiveness', 'Peace', 'Resilience', 'Courage', 'Gratitude'];

// Define distinct visual styles for variety
const QUOTE_STYLES = [
  {
    name: 'Cinematic',
    prompt: (text: string) => `A cinematic, minimalist, high-quality background image visually representing this quote: "${text}". Mood: Spiritual, peaceful. No text.`,
    textClass: 'font-serif text-white text-xl md:text-2xl font-medium leading-relaxed drop-shadow-lg italic',
    overlayClass: 'bg-black/20'
  },
  {
    name: 'Watercolor',
    prompt: (text: string) => `A soft, dreamy watercolor painting visualizing the imagery in this quote: "${text}". Pastel colors, artistic, ethereal, white paper texture background. No text.`,
    textClass: 'font-serif text-slate-900 text-xl md:text-2xl font-bold leading-relaxed drop-shadow-sm',
    overlayClass: 'bg-white/20'
  },
  {
    name: 'Noir',
    prompt: (text: string) => `Black and white fine art photography representing the meaning of: "${text}". High contrast, dramatic shadows, noir style. No text.`,
    textClass: 'font-sans text-white text-lg md:text-xl font-light tracking-[0.2em] uppercase drop-shadow-md',
    overlayClass: 'bg-black/40'
  },
  {
    name: 'Warm Retro',
    prompt: (text: string) => `Vintage 70s style illustration visualizing: "${text}". Warm orange and yellow tones, grainy texture. No text.`,
    textClass: 'font-serif text-amber-50 text-xl md:text-2xl font-bold tracking-wide drop-shadow-md',
    overlayClass: 'bg-orange-900/20'
  },
  {
    name: 'Ethereal Glow',
    prompt: (text: string) => `Abstract spiritual background representing the concept of: "${text}". Deep blue and purple gradient, glowing elements, magical atmosphere. No text.`,
    textClass: 'font-sans text-white text-lg md:text-xl font-medium tracking-wide drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]',
    overlayClass: 'bg-indigo-900/40'
  },
  {
    name: 'Nature Macro',
    prompt: (text: string) => `Hyper-realistic macro photography visualizing: "${text}". Soft bokeh, morning dew, golden hour light. No text.`,
    textClass: 'font-sans text-white text-xl md:text-2xl font-semibold leading-relaxed drop-shadow-lg',
    overlayClass: 'bg-black/10'
  }
];

interface QuoteEngineProps {
  user: User | null;
}

interface QuoteItem {
  text: string;
  title: string;
  visualBase64?: string;
  isVisualizing: boolean;
  styleIndex?: number;
}

const QuoteEngine: React.FC<QuoteEngineProps> = ({ user }) => {
  const [selectedMetaphors, setSelectedMetaphors] = useState<string[]>([]);
  const [selectedVirtues, setSelectedVirtues] = useState<string[]>([]);
  const [count, setCount] = useState(5);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleSelection = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generatedData = await generateQuotes(selectedMetaphors, selectedVirtues, count);
      const newQuotes = generatedData.map(item => ({ 
          text: item.quote, 
          title: item.title,
          isVisualizing: false 
      }));
      setQuotes(newQuotes);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVisualize = async (index: number) => {
    const quote = quotes[index];
    if (quote.visualBase64 || quote.isVisualizing) return;

    // Randomize Strategy
    const randomStyleIndex = Math.floor(Math.random() * QUOTE_STYLES.length);
    const selectedStyle = QUOTE_STYLES[randomStyleIndex];
    
    setQuotes(prev => prev.map((q, i) => i === index ? { ...q, isVisualizing: true, styleIndex: randomStyleIndex } : q));

    try {
      // Use the actual quote text to generate the prompt, ensuring relevance
      const prompt = selectedStyle.prompt(quote.text);
      
      // We pass 'None' as style to generateImageFromPrompt because we baked the style into the prompt string
      const base64 = await generateImageFromPrompt(prompt, 'None', 'gemini-2.5-flash-image', undefined, '9:16');
      
      setQuotes(prev => prev.map((q, i) => i === index ? { ...q, visualBase64: base64, isVisualizing: false } : q));
      
      // Auto-save generated image to history if user is logged in
      if (user && base64) {
          await storageService.saveImage(user.id, {
              id: `quote-bg-${Date.now()}`,
              base64: base64,
              prompt: `Quote (${selectedStyle.name}): ${quote.text.substring(0, 30)}...`,
              style: selectedStyle.name,
              model: 'gemini-2.5-flash-image',
              createdAt: Date.now()
          });
      }

    } catch (e) {
      console.error(e);
      setQuotes(prev => prev.map((q, i) => i === index ? { ...q, isVisualizing: false } : q));
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Endless Quote Engine</h2>
        <p className="text-slate-500">Generate limitless spiritual & metaphorical content for social media.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
             {/* Metaphors */}
             <div className="mb-6">
                <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                   <ImageIcon className="w-4 h-4 text-blue-500" />
                   Metaphors
                </label>
                <div className="flex flex-wrap gap-2">
                   {METAPHORS.map(m => (
                      <button
                        key={m}
                        onClick={() => toggleSelection(selectedMetaphors, setSelectedMetaphors, m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                           selectedMetaphors.includes(m) 
                           ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-500' 
                           : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {m}
                      </button>
                   ))}
                </div>
             </div>

             {/* Virtues */}
             <div className="mb-6">
                <label className="block text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-purple-500" />
                   Virtues
                </label>
                <div className="flex flex-wrap gap-2">
                   {VIRTUES.map(v => (
                      <button
                        key={v}
                        onClick={() => toggleSelection(selectedVirtues, setSelectedVirtues, v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                           selectedVirtues.includes(v) 
                           ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-500' 
                           : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {v}
                      </button>
                   ))}
                </div>
             </div>

             {/* Count */}
             <div className="mb-6">
                 <label className="block text-sm font-bold text-slate-900 mb-3">Quantity</label>
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                    {[5, 10, 20].map(n => (
                       <button
                         key={n}
                         onClick={() => setCount(n)}
                         className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                            count === n ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                         }`}
                       >
                         {n}
                       </button>
                    ))}
                 </div>
             </div>

             <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-70"
             >
                {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                {isGenerating ? 'Weaving Words...' : 'Generate Quotes'}
             </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-8">
           {quotes.length === 0 ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
                  <Quote className="w-12 h-12 mb-4 opacity-20" />
                  <p>Select your themes and generate endless wisdom.</p>
              </div>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {quotes.map((quote, idx) => {
                    // Determine style for this quote item
                    const styleIndex = quote.styleIndex !== undefined ? quote.styleIndex : 0;
                    const currentStyle = QUOTE_STYLES[styleIndex];

                    return (
                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                       {/* Visual Area */}
                       <div className="relative aspect-[9/16] bg-slate-100 flex items-center justify-center group overflow-hidden">
                          {quote.visualBase64 ? (
                             <>
                                <img src={`data:image/png;base64,${quote.visualBase64}`} alt="Background" className="w-full h-full object-cover" />
                                {/* Dynamic Text Overlay based on Style */}
                                <div className={`absolute inset-0 flex items-center justify-center p-6 text-center ${currentStyle.overlayClass || ''}`}>
                                   <p className={currentStyle.textClass}>
                                      "{quote.text}"
                                   </p>
                                </div>
                                <a 
                                  href={`data:image/png;base64,${quote.visualBase64}`} 
                                  download={`quote-${idx}.png`}
                                  className="absolute bottom-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                                >
                                   <Download className="w-5 h-5" />
                                </a>
                             </>
                          ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-50 to-slate-100">
                                {quote.isVisualizing ? (
                                   <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                                ) : (
                                   <>
                                     <p className="text-slate-800 font-serif text-lg leading-relaxed mb-6">"{quote.text}"</p>
                                     <button 
                                       onClick={() => handleVisualize(idx)}
                                       className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:text-blue-600 hover:border-blue-200 flex items-center gap-2 transition-colors shadow-sm"
                                     >
                                        <ImageIcon className="w-3 h-3" />
                                        Visualize
                                     </button>
                                   </>
                                )}
                             </div>
                          )}
                       </div>

                       {/* Actions Footer */}
                       <div className="p-3 bg-white border-t border-slate-100 flex justify-between items-center">
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded">
                            {quote.title || 'Insta / Shorts Ready'}
                          </span>
                          <button 
                             onClick={() => copyToClipboard(quote.text, idx)}
                             className="text-slate-400 hover:text-slate-700 transition-colors"
                             title="Copy text"
                          >
                             {copiedIndex === idx ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                       </div>
                    </div>
                 );
                 })}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default QuoteEngine;