import React, { useState } from 'react';
import { Download, RefreshCw, Copy, Check, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { PinResult } from '../types';

interface ResultsPageProps {
  results: PinResult[];
  onGenerateImage: (id: string) => void;
  onReset: () => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ results, onGenerateImage, onReset }) => {
  return (
    <div className="bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
           <div>
              <h1 className="text-3xl font-bold text-slate-900">Your Pinterest Pins</h1>
              <p className="text-slate-500 mt-1">SEO-optimized and ready to publish.</p>
           </div>
           <button 
             onClick={onReset}
             className="px-6 py-2 bg-white border border-slate-200 rounded-full text-slate-700 font-medium hover:bg-slate-50 transition-colors"
           >
             Create New Pins
           </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {results.map((pin, index) => (
             <PinCard key={pin.id} pin={pin} index={index + 1} onGenerateImage={() => onGenerateImage(pin.id)} />
          ))}
        </div>
      </div>
    </div>
  );
};

const PinCard: React.FC<{ pin: PinResult; index: number; onGenerateImage: () => void }> = ({ pin, index, onGenerateImage }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownloadImage = () => {
    if (pin.base64Image) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${pin.base64Image}`;
      link.download = `pinterest-pin-${index}.png`;
      link.click();
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
         <h3 className="font-bold text-slate-800">Variation {index}</h3>
         <div className="text-xs font-semibold px-2 py-1 bg-red-50 text-red-600 rounded">High Potential</div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-8">
         {/* Visual Preview Section */}
         <div className="bg-slate-100 rounded-2xl overflow-hidden min-h-[400px] flex items-center justify-center relative group">
            {pin.base64Image ? (
               <img 
                 src={`data:image/png;base64,${pin.base64Image}`} 
                 alt="Generated Pin" 
                 className="w-full h-full object-cover"
               />
            ) : (
               <div className="text-center p-6 max-w-xs">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                     {pin.isGeneratingImage ? (
                        <RefreshCw className="w-6 h-6 text-red-600 animate-spin" />
                     ) : (
                        <ImageIcon className="w-6 h-6 text-slate-400" />
                     )}
                  </div>
                  <h4 className="text-slate-900 font-semibold mb-1">
                     {pin.isGeneratingImage ? "Designing your pin..." : "Visual Not Generated Yet"}
                  </h4>
                  <p className="text-sm text-slate-500 mb-4">
                     {pin.isGeneratingImage ? "AI is crafting the layout, typography, and colors." : "Generate a custom image based on this copy."}
                  </p>
                  {!pin.isGeneratingImage && (
                     <button 
                        onClick={onGenerateImage}
                        className="px-5 py-2 bg-slate-900 text-white rounded-full text-sm font-medium hover:bg-black transition-colors"
                     >
                        Generate Image
                     </button>
                  )}
               </div>
            )}

            {/* Image Actions Overlay */}
            {pin.base64Image && (
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button 
                     onClick={handleDownloadImage}
                     className="p-3 bg-white rounded-full text-slate-900 hover:scale-105 transition-transform"
                     title="Download PNG"
                  >
                     <Download className="w-5 h-5" />
                  </button>
                   <button 
                     onClick={onGenerateImage}
                     className="p-3 bg-white rounded-full text-slate-900 hover:scale-105 transition-transform"
                     title="Regenerate"
                  >
                     <RefreshCw className="w-5 h-5" />
                  </button>
               </div>
            )}
         </div>

         {/* Copy / Text Section */}
         <div className="space-y-6">
            <CopyBlock 
              label="📌 Pin Title" 
              content={pin.title} 
              onCopy={() => copyToClipboard(pin.title, 'title')} 
              isCopied={copiedSection === 'title'}
            />
             <CopyBlock 
              label="✍️ Pin Description" 
              content={pin.description} 
              onCopy={() => copyToClipboard(pin.description, 'desc')} 
              isCopied={copiedSection === 'desc'}
              isLong
            />

            <CopyBlock 
              label="♿ Alt Text" 
              content={pin.alt_text} 
              onCopy={() => copyToClipboard(pin.alt_text, 'alt_text')} 
              isCopied={copiedSection === 'alt_text'}
              isLong
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <CopyBlock 
                  label="Headline Text" 
                  content={pin.headline} 
                  onCopy={() => copyToClipboard(pin.headline, 'headline')} 
                  isCopied={copiedSection === 'headline'}
               />
                <CopyBlock 
                  label="Button CTA" 
                  content={pin.cta} 
                  onCopy={() => copyToClipboard(pin.cta, 'cta')} 
                  isCopied={copiedSection === 'cta'}
               />
            </div>

            {/* Keywords */}
            <div className="pt-4 border-t border-slate-100">
               <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  🔍 SEO Keywords
                  <button 
                     onClick={() => copyToClipboard(pin.primary_keywords.join(', '), 'keywords')}
                     className="text-xs text-red-600 font-medium hover:underline ml-auto"
                  >
                     {copiedSection === 'keywords' ? 'Copied!' : 'Copy All'}
                  </button>
               </h4>
               <div className="flex flex-wrap gap-2">
                  {pin.primary_keywords.slice(0, 6).map(k => (
                     <span key={k} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                        {k}
                     </span>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const CopyBlock: React.FC<{ label: string; content: string; onCopy: () => void; isCopied: boolean; isLong?: boolean }> = ({ label, content, onCopy, isCopied, isLong }) => (
  <div className="group relative">
    <div className="flex justify-between items-baseline mb-1">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
    </div>
    <div 
      className={`relative bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-sm hover:border-slate-300 transition-colors cursor-pointer ${isLong ? 'min-h-[80px]' : ''}`}
      onClick={onCopy}
    >
      {content}
      <div className="absolute top-2 right-2 p-1.5 rounded-md bg-white shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
        {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
      </div>
    </div>
  </div>
);

export default ResultsPage;