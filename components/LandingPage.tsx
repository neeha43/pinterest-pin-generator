import React from 'react';
import { ArrowRight, Sparkles, FileText, Palette, Target } from 'lucide-react';
import ImageGenerator from './ImageGenerator';
import { User } from '../types';

interface LandingPageProps {
  onStart: () => void;
  user: User | null;
  onImageSaved?: () => void;
  activeTab: 'pins' | 'images';
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, user, onImageSaved, activeTab }) => {
  return (
    <div className="w-full max-w-5xl mx-auto">
      {activeTab === 'images' ? (
        <div className="max-w-4xl mx-auto w-full">
          <ImageGenerator user={user} onImageSaved={onImageSaved} />
        </div>
      ) : (
        <PinterestToolView onStart={onStart} />
      )}
    </div>
  );
};

const PinterestToolView: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="flex flex-col items-center justify-center w-full animate-in fade-in duration-500 py-8">
      <div className="text-center mb-6 shrink-0">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Pinterest Pin Generator</h2>
        <p className="text-slate-500">Create SEO-optimized, high-converting pins for your content.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 text-center w-full shrink-0">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <Sparkles className="w-8 h-8" />
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-2">Start a New Pin Project</h3>
          <p className="text-slate-600 max-w-lg mx-auto mb-8 text-sm">
             Our AI wizard will guide you through a quick process to define your goal, audience, and style. We'll generate optimized titles, descriptions, and custom visuals tailored to your niche.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8 text-left">
             <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-red-600 shadow-sm">
                   <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">1. Strategy</div>
                  <p className="text-xs text-slate-500 mt-0.5">Define your goals, niche, and target audience.</p>
                </div>
             </div>
             
             <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-red-600 shadow-sm">
                   <FileText className="w-4 h-4" />
                </div>
                <div>
                   <div className="font-semibold text-slate-900 text-sm">2. Copy</div>
                   <p className="text-xs text-slate-500 mt-0.5">Get SEO-optimized titles and description copy.</p>
                </div>
             </div>
             
             <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-red-600 shadow-sm">
                   <Palette className="w-4 h-4" />
                </div>
                <div>
                   <div className="font-semibold text-slate-900 text-sm">3. Visuals</div>
                   <p className="text-xs text-slate-500 mt-0.5">Generate custom, scroll-stopping AI images.</p>
                </div>
             </div>
          </div>

          <button 
            onClick={onStart}
            className="inline-flex items-center justify-center px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all group"
          >
            Create New Pin
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
      </div>
  </div>
);

export default LandingPage;