import React from 'react';
import { History, Image as ImageIcon, Sparkles, LogOut, Type, Quote } from 'lucide-react';
import { User, ActiveTab } from '../types';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  user: User | null;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, user, onLogout }) => {
  return (
    <>
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-col hidden md:flex sticky top-0 h-screen shadow-xl z-20 shrink-0">
        <div className="p-6 border-b border-slate-800">
           <div className="font-bold text-2xl text-white tracking-tight flex items-center gap-2">
               <span className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-sm shadow-lg shadow-red-900/20">A</span>
               Aesthrya
           </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
           <button 
              onClick={() => onTabChange('images')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'images' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}
           >
              <ImageIcon className="w-5 h-5" />
              AI Image Generator
           </button>
           <button 
              onClick={() => onTabChange('pins')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'pins' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}
           >
              <Sparkles className="w-5 h-5" />
              Pinterest Pins
           </button>
           <button 
              onClick={() => onTabChange('text-overlay')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'text-overlay' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}
           >
              <Type className="w-5 h-5" />
              Text on Image
           </button>
           <button 
              onClick={() => onTabChange('quotes')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'quotes' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}
           >
              <Quote className="w-5 h-5" />
              Quote Engine
           </button>
        </nav>

        {/* History moved to bottom */}
        {user && (
          <div className="px-4 pb-2">
             <button 
                onClick={() => onTabChange('history')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === 'history' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                  <History className="w-5 h-5" />
                  History
              </button>
          </div>
        )}

        <div className="p-4 border-t border-slate-800">
           {user && (
             <div className="flex flex-col gap-2">
                <div className="px-4 py-2">
                   <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Signed in as</div>
                   <div className="text-sm font-medium text-white truncate">{user.name}</div>
                </div>
                <button onClick={onLogout} className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors">
                    <LogOut className="w-4 h-4" />
                    Log out
                </button>
             </div>
           )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white z-50 px-4 py-3 flex justify-between items-center shadow-md">
           <div className="font-bold text-xl tracking-tight flex items-center gap-2">
              <span className="w-6 h-6 bg-gradient-to-br from-red-500 to-orange-600 rounded flex items-center justify-center text-xs">A</span>
              Aesthrya
           </div>
           <div className="flex gap-4">
              <button onClick={() => onTabChange('images')} className={activeTab === 'images' ? 'text-red-500' : 'text-slate-400'}>
                 <ImageIcon className="w-6 h-6" />
              </button>
              <button onClick={() => onTabChange('quotes')} className={activeTab === 'quotes' ? 'text-red-500' : 'text-slate-400'}>
                 <Quote className="w-6 h-6" />
              </button>
              <button onClick={() => onTabChange('pins')} className={activeTab === 'pins' ? 'text-red-500' : 'text-slate-400'}>
                 <Sparkles className="w-6 h-6" />
              </button>
              {user && <button onClick={() => onTabChange('history')} className={activeTab === 'history' ? 'text-red-500' : 'text-slate-400'}><History className="w-6 h-6" /></button>}
           </div>
       </div>
    </>
  );
};