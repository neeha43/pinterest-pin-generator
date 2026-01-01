import React from 'react';
import { ArrowRight, ShoppingBag, Users, Video, Link as LinkIcon, Briefcase } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero Section */}
      <header className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
          New: AI-Powered Visuals Included
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
          Create <span className="text-red-600">High-Click</span><br /> Pinterest Pins in Minutes
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          Answer a few simple questions. Get SEO-optimized titles, descriptions, and scroll-stopping pin images instantly.
        </p>

        <button 
          onClick={onStart}
          className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-red-600 rounded-full hover:bg-red-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
        >
          Generate Pinterest Pins Free
          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="mt-8 text-sm font-medium text-slate-500">
          Works for blogs, products, coaches, creators & businesses
        </div>
      </header>

      {/* Social Proof / Use Cases */}
      <section className="bg-slate-50 border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-center opacity-70">
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <LinkIcon className="w-6 h-6 text-slate-700" />
              </div>
              <span className="text-sm font-semibold text-slate-600">Bloggers</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <ShoppingBag className="w-6 h-6 text-slate-700" />
              </div>
              <span className="text-sm font-semibold text-slate-600">Online Stores</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Users className="w-6 h-6 text-slate-700" />
              </div>
              <span className="text-sm font-semibold text-slate-600">Coaches</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Video className="w-6 h-6 text-slate-700" />
              </div>
              <span className="text-sm font-semibold text-slate-600">YouTubers</span>
            </div>
             <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Briefcase className="w-6 h-6 text-slate-700" />
              </div>
              <span className="text-sm font-semibold text-slate-600">Marketers</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
