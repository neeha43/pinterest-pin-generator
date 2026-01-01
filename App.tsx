import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Generator from './components/Generator';
import ResultsPage from './components/ResultsPage';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import { WizardAnswers, PinResult, ViewState, User } from './types';
import { generatePinCopy, generatePinImage } from './services/geminiService';
import { storageService } from './services/storageService';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('auth'); // Start at Auth
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<PinResult[]>([]);
  const [savedPins, setSavedPins] = useState<PinResult[]>([]);
  const [answers, setAnswers] = useState<WizardAnswers | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing session
    const currentUser = storageService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setSavedPins(storageService.getPins(currentUser.id));
      setView('landing');
    } else {
      setView('auth');
    }
  }, []);

  const handleLogin = (email: string) => {
    const loggedInUser = storageService.login(email);
    setUser(loggedInUser);
    setSavedPins(storageService.getPins(loggedInUser.id));
    setView('landing');
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setResults([]);
    setSavedPins([]);
    setView('auth');
  };

  const handleStart = () => {
    setView('generator');
    setError(null);
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
      storageService.savePins(user.id, initialResults);
      setSavedPins(storageService.getPins(user.id));

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
      storageService.updatePinImage(user.id, id, base64);
      setSavedPins(storageService.getPins(user.id));
      
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

  if (view === 'auth') {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (view === 'dashboard' && user) {
    return (
      <Dashboard 
        user={user} 
        pins={savedPins} 
        onCreateNew={handleStart} 
        onLogout={handleLogout} 
      />
    );
  }

  if (view === 'landing') {
    return (
      <LandingPage 
        onStart={handleStart} 
        user={user} 
        onGoToDashboard={() => setView('dashboard')}
        onLogout={handleLogout}
      />
    );
  }

  if (view === 'generator') {
    return (
      <>
        {isGenerating && (
          <div className="fixed inset-0 z-50 bg-white/90 flex flex-col items-center justify-center p-4 text-center">
            <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Creating your Pins...</h2>
            <p className="text-slate-500 max-w-md">Our AI is analyzing your niche, optimizing keywords, and designing layouts.</p>
          </div>
        )}
         {error && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
              <button className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
                <span className="text-xl">&times;</span>
              </button>
            </div>
          )}
        <Generator onComplete={handleGeneratorComplete} onBack={() => setView('landing')} />
      </>
    );
  }

  if (view === 'results') {
    return (
      <ResultsPage 
        results={results} 
        onGenerateImage={(id) => handleGenerateImage(id, answers)} 
        onReset={handleReset} 
      />
    );
  }

  return null;
};

export default App;
