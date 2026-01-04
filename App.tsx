import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Generator from './components/Generator';
import ResultsPage from './components/ResultsPage';
import AuthPage from './components/AuthPage';
import History from './components/Dashboard'; 
import { Navigation } from './components/Navigation';
import { WizardAnswers, PinResult, ViewState, User, GeneratedImage, ActiveTab } from './types';
import { generatePinCopy, generatePinImage } from './services/geminiService';
import { storageService } from './services/storageService';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('auth'); // Start at Auth
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<PinResult[]>([]);
  const [savedPins, setSavedPins] = useState<PinResult[]>([]);
  const [savedImages, setSavedImages] = useState<GeneratedImage[]>([]);
  const [answers, setAnswers] = useState<WizardAnswers | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('images');

  useEffect(() => {
    // Check for existing session and load data asynchronously
    const initSession = async () => {
      const currentUser = storageService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        try {
          const [pins, images] = await Promise.all([
             storageService.getPins(currentUser.id),
             storageService.getImages(currentUser.id)
          ]);
          setSavedPins(pins);
          setSavedImages(images);
          setView('landing');
        } catch (e) {
          console.error("Failed to load user data", e);
          setView('landing'); // Proceed anyway
        }
      } else {
        setView('auth');
      }
    };
    initSession();
  }, []);

  const handleLogin = async (email: string) => {
    const loggedInUser = storageService.login(email);
    setUser(loggedInUser);
    try {
      const [pins, images] = await Promise.all([
          storageService.getPins(loggedInUser.id),
          storageService.getImages(loggedInUser.id)
      ]);
      setSavedPins(pins);
      setSavedImages(images);
    } catch (e) {
      console.error("Error loading data", e);
    }
    setView('landing');
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setResults([]);
    setSavedPins([]);
    setSavedImages([]);
    setView('auth');
    setActiveTab('images');
  };

  const handleStart = () => {
    setView('generator');
    setError(null);
  };

  const handleImageSaved = async () => {
    if (user) {
      const images = await storageService.getImages(user.id);
      setSavedImages(images);
    }
  };

  const handleGeneratorComplete = async (collectedAnswers: WizardAnswers) => {
    if (!user) return; // Should not happen given flow
    setAnswers(collectedAnswers);
    setIsGenerating(true);
    setError(null);
    
    // Optimistic UI for generation
    setView('results');

    try {
      // 1. Generate Copy first (fast)
      const copyData = await generatePinCopy(collectedAnswers);
      
      const initialResults: PinResult[] = copyData.map((data, index) => ({
        ...data,
        id: `pin-${Date.now()}-${index}`,
        base64Image: undefined,
        isGeneratingImage: false,
        createdAt: Date.now()
      }));

      setResults(initialResults);
      setIsGenerating(false);

      // Save immediately to history
      await storageService.savePins(user.id, initialResults);
      const updatedPins = await storageService.getPins(user.id);
      setSavedPins(updatedPins);

      // 2. Automatically kick off image generation for the first result
      if (initialResults.length > 0) {
        handleGenerateImage(initialResults[0].id, collectedAnswers, initialResults[0]);
      }

    } catch (err) {
      console.error(err);
      setError("Failed to generate pins. Please try again.");
      setIsGenerating(false);
      setView('generator');
    }
  };

  const handleGenerateImage = async (id: string, currentAnswers: WizardAnswers | null, pin?: PinResult) => {
    if (!currentAnswers || !user) return;

    const targetPin = pin || results.find(r => r.id === id);
    if (!targetPin) return;

    setResults(prev => prev.map(p => p.id === id ? { ...p, isGeneratingImage: true } : p));

    try {
      const base64 = await generatePinImage(currentAnswers, targetPin);
      
      // Update local view state
      setResults(prev => prev.map(p => p.id === id ? { ...p, base64Image: base64, isGeneratingImage: false } : p));
      
      // Update persistent storage
      await storageService.updatePinImage(user.id, id, base64);
      const updatedPins = await storageService.getPins(user.id);
      setSavedPins(updatedPins);
      
    } catch (err) {
      console.error(err);
      setResults(prev => prev.map(p => p.id === id ? { ...p, isGeneratingImage: false } : p));
    }
  };

  const handleReset = () => {
    setResults([]);
    setAnswers(null);
    setView('landing');
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'history') {
      setView('history');
    } else {
      // Reset view to landing for the tool
      setView('landing');
    }
  };

  if (view === 'auth') {
    return <AuthPage onLogin={handleLogin} />;
  }

  // Persistent Layout for all authenticated views
  return (
    <div className="flex min-h-screen bg-slate-50">
       <Navigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange} 
          user={user} 
          onLogout={handleLogout} 
       />
       
       {/* Main Content Area */}
       <main className="flex-1 flex flex-col md:overflow-hidden h-screen pt-14 md:pt-0 bg-slate-50">
          <div className="flex-1 overflow-y-auto">
            {/* Global Loader Overlay */}
            {isGenerating && (
              <div className="fixed inset-0 z-50 bg-white/90 flex flex-col items-center justify-center p-4 text-center">
                <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Creating your Pins...</h2>
                <p className="text-slate-500 max-w-md">Our AI is analyzing your niche, optimizing keywords, and designing layouts.</p>
              </div>
            )}
            
            {/* Global Error Overlay */}
            {error && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow-lg" role="alert">
                  <span className="block sm:inline mr-8">{error}</span>
                  <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
                    <span className="text-xl">&times;</span>
                  </button>
                </div>
            )}

            {/* Views */}
            {view === 'history' && user && (
               <History 
                  user={user} 
                  pins={savedPins} 
                  images={savedImages}
                  onCreateNew={(tab) => handleTabChange(tab as any)} // Cast for compatibility with dashboard
                  onLogout={handleLogout} 
               />
            )}

            {view === 'landing' && (
              <div className="p-4 md:p-6 min-h-full">
                <LandingPage 
                  onStart={handleStart} 
                  user={user} 
                  onImageSaved={handleImageSaved}
                  activeTab={activeTab} 
                />
              </div>
            )}

            {view === 'generator' && (
              <Generator onComplete={handleGeneratorComplete} onBack={() => setView('landing')} />
            )}

            {view === 'results' && (
              <ResultsPage 
                results={results} 
                onGenerateImage={(id) => handleGenerateImage(id, answers)} 
                onReset={handleReset} 
              />
            )}
          </div>
       </main>
    </div>
  );
};

export default App;