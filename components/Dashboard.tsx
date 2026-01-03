import React, { useState } from 'react';
import { PinResult, User, GeneratedImage } from '../types';
import { Plus, Download, Sparkles, Image as ImageIcon } from 'lucide-react';

interface HistoryProps {
  user: User;
  pins: PinResult[];
  images: GeneratedImage[];
  onCreateNew: (tab: 'pins' | 'images') => void;
  onLogout: () => void;
}

type Tab = 'pins' | 'images';

const History: React.FC<HistoryProps> = ({ user, pins, images, onCreateNew, onLogout }) => {
  const [activeTab, setActiveTab] = useState<Tab>('pins');

  return (
    <div className="bg-slate-50 w-full">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your History</h1>
            <p className="text-slate-500 mt-1">View your past creations and generated assets.</p>
          </div>
          <button 
            onClick={() => onCreateNew(activeTab)}
            className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 hover:bg-black text-white font-semibold rounded-full shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-8">
           <button 
             onClick={() => setActiveTab('pins')}
             className={`px-4 py-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
               activeTab === 'pins' 
               ? 'border-red-600 text-red-600' 
               : 'border-transparent text-slate-500 hover:text-slate-800'
             }`}
           >
             <Sparkles className="w-4 h-4" />
             Pinterest Pins ({pins.length})
           </button>
           <button 
             onClick={() => setActiveTab('images')}
             className={`px-4 py-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
               activeTab === 'images' 
               ? 'border-red-600 text-red-600' 
               : 'border-transparent text-slate-500 hover:text-slate-800'
             }`}
           >
             <ImageIcon className="w-4 h-4" />
             AI Images ({images.length})
           </button>
        </div>

        {/* Content */}
        {activeTab === 'pins' && (
          pins.length === 0 ? (
            <EmptyState 
              icon={<Sparkles className="w-8 h-8 text-slate-400" />}
              title="No pins yet"
              description="Start creating SEO-optimized Pinterest pins for your content today."
              actionLabel="Start Pin Generator"
              onAction={() => onCreateNew('pins')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pins.map((pin) => (
                <HistoryPinCard key={pin.id} pin={pin} />
              ))}
            </div>
          )
        )}

        {activeTab === 'images' && (
           images.length === 0 ? (
            <EmptyState 
              icon={<ImageIcon className="w-8 h-8 text-slate-400" />}
              title="No images yet"
              description="Generate stunning visuals with our AI Image Generator."
              actionLabel="Go to Image Generator"
              onAction={() => onCreateNew('images')} 
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {images.map((img) => (
                 <HistoryImageCard key={img.id} image={img} />
               ))}
            </div>
          )
        )}
      </main>
    </div>
  );
};

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string; actionLabel: string; onAction: () => void }> = ({ icon, title, description, actionLabel, onAction }) => (
  <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>
    <button 
      onClick={onAction}
      className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-black transition-colors"
    >
      {actionLabel}
    </button>
  </div>
);

const HistoryPinCard: React.FC<{ pin: PinResult }> = ({ pin }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="aspect-[3/2] bg-slate-100 relative overflow-hidden group">
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

const HistoryImageCard: React.FC<{ image: GeneratedImage }> = ({ image }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
       <div className="aspect-square bg-slate-100 relative overflow-hidden group">
          <img src={`data:image/png;base64,${image.base64}`} alt="AI Generated" className="w-full h-full object-cover" />
           <div className="absolute top-2 right-2">
            <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                {new Date(image.createdAt).toLocaleDateString()}
            </span>
        </div>
       </div>
       <div className="p-5 flex-1 flex flex-col">
          <p className="text-sm text-slate-800 line-clamp-3 mb-4 flex-1 font-medium">"{image.prompt}"</p>
          
          <div className="flex items-center gap-2 mb-4">
             <span className="text-[10px] px-2 py-1 bg-slate-100 rounded text-slate-600 font-medium">{image.style}</span>
             <span className="text-[10px] px-2 py-1 bg-slate-100 rounded text-slate-600">{image.model.includes('pro') ? 'Pro' : 'Flash'}</span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
             <a 
               href={`data:image/png;base64,${image.base64}`} 
               download={`ai-image-${image.id}.png`}
               className="text-slate-400 hover:text-slate-900 flex items-center gap-1 text-xs font-medium"
             >
               <Download className="w-4 h-4" /> Download
             </a>
          </div>
       </div>
    </div>
  );
};

export default History;