import React from 'react';
import { PinResult, User } from '../types';
import { Plus, ArrowLeft, Download, Calendar } from 'lucide-react';

interface DashboardProps {
  user: User;
  pins: PinResult[];
  onCreateNew: () => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, pins, onCreateNew, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="font-bold text-xl text-slate-900 tracking-tight flex items-center gap-2">
             <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white text-sm">PG</span>
             PinGenie
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:block">Welcome, {user.name}</span>
            <button onClick={onLogout} className="text-sm font-medium text-slate-600 hover:text-red-600">
              Log out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage your generated pins and creations.</p>
          </div>
          <button 
            onClick={onCreateNew}
            className="inline-flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Pin
          </button>
        </div>

        {pins.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No pins yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Start creating SEO-optimized Pinterest pins for your content today.</p>
            <button 
              onClick={onCreateNew}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-black transition-colors"
            >
              Start Generator
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pins.map((pin) => (
              <DashboardPinCard key={pin.id} pin={pin} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const DashboardPinCard: React.FC<{ pin: PinResult }> = ({ pin }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="aspect-[3/2] bg-slate-100 relative overflow-hidden">
        {pin.base64Image ? (
          <img src={`data:image/png;base64,${pin.base64Image}`} alt={pin.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 p-4 text-center text-sm">
            No Image Generated
          </div>
        )}
        <div className="absolute top-2 right-2">
            <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                {pin.createdAt ? new Date(pin.createdAt).toLocaleDateString() : 'Recent'}
            </span>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-900 line-clamp-2 mb-2">{pin.title}</h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{pin.description}</p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {pin.primary_keywords.slice(0,3).map(k => (
            <span key={k} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded">#{k}</span>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
           <span className="text-xs font-medium text-slate-400">
              Headline: {pin.headline.substring(0, 20)}...
           </span>
           {pin.base64Image && (
             <a 
               href={`data:image/png;base64,${pin.base64Image}`} 
               download={`pin-${pin.id}.png`}
               className="text-slate-400 hover:text-slate-900"
               title="Download Image"
             >
               <Download className="w-4 h-4" />
             </a>
           )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
