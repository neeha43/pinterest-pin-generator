
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Music, Mic, Wand2, Play, Pause, Download, Loader2, Video, Volume2, Sparkles, Copy, Check } from 'lucide-react';
import { analyzeVideoFrames, generateSpeech } from '../services/geminiService';
import { VideoAnalysisResult, User } from '../types';

interface VideoAlchemistProps {
  user: User | null;
}

const VideoAlchemist: React.FC<VideoAlchemistProps> = ({ user }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VideoAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Voiceover State
  const [script, setScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (generatedAudioUrl) URL.revokeObjectURL(generatedAudioUrl);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("Video size too large. Please keep under 50MB for this demo.");
        return;
      }
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setAnalysis(null);
      setGeneratedAudioUrl(null);
    }
  };

  const extractFrames = async (): Promise<string[]> => {
    if (!videoRef.current || !canvasRef.current) return [];
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const frames: string[] = [];
    const duration = video.duration;

    // Capture 3 frames: 20%, 50%, 80%
    const timePoints = [duration * 0.2, duration * 0.5, duration * 0.8];

    for (const time of timePoints) {
      video.currentTime = time;
      await new Promise(resolve => {
        const onSeek = () => {
          video.removeEventListener('seeked', onSeek);
          if (ctx) {
             canvas.width = video.videoWidth;
             canvas.height = video.videoHeight;
             ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
             // Use lower quality jpeg to save tokens/bandwidth
             frames.push(canvas.toDataURL('image/jpeg', 0.7));
          }
          resolve(true);
        };
        video.addEventListener('seeked', onSeek);
      });
    }
    
    // Reset video
    video.currentTime = 0;
    return frames;
  };

  const handleAnalyze = async () => {
    if (!videoRef.current) return;
    setIsAnalyzing(true);
    
    try {
      const frames = await extractFrames();
      if (frames.length === 0) throw new Error("Could not extract frames");
      
      const result = await analyzeVideoFrames(frames);
      setAnalysis(result);
      setScript(result.script);
    } catch (e) {
      console.error(e);
      alert("Failed to analyze video. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!script) return;
    setIsGeneratingAudio(true);
    try {
      const buffer = await generateSpeech(script, selectedVoice);
      const blob = new Blob([buffer], { type: 'audio/wav' }); // PCM wrapped in wav logic usually handled by browser or raw
      
      // Since it's raw PCM, we need to create a WAV header or use AudioContext to play. 
      // For simplicity in this demo, we will use a Blob, but standard browsers might need a WAV header container for raw PCM data from Gemini.
      // However, usually AudioContext decodeAudioData handles it better.
      // Let's create an AudioContext-compatible blob URL? 
      // Actually, standard HTML5 Audio element struggles with raw PCM.
      // We will create a WAV file wrapper for the PCM data.
      
      const wavBlob = pcmToWav(buffer);
      const url = URL.createObjectURL(wavBlob);
      
      setGeneratedAudioUrl(url);
      if (audioRef.current) audioRef.current.src = url;
    } catch (e) {
      console.error("Audio Gen Error", e);
      alert("Failed to generate audio.");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Helper to wrap raw PCM in WAV container (1 channel, 24kHz as per Gemini output)
  const pcmToWav = (pcmData: ArrayBuffer) => {
    const numChannels = 1;
    const sampleRate = 24000; 
    const byteRate = sampleRate * numChannels * 2; // 16-bit
    const blockAlign = numChannels * 2;
    const dataSize = pcmData.byteLength;
    
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    
    // fmt chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true); // BitsPerSample
    
    // data chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write PCM data
    const pcmBytes = new Uint8Array(pcmData);
    const wavBytes = new Uint8Array(buffer);
    wavBytes.set(pcmBytes, 44);
    
    return new Blob([buffer], { type: 'audio/wav' });
  };
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlayingAudio(!isPlayingAudio);
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Video Alchemist</h2>
        <p className="text-slate-500">Transform raw video into viral content: Music matching, AI Voiceovers, and Social Copy.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Left: Video Input */}
         <div className="flex flex-col gap-6">
            <div className="bg-black rounded-3xl overflow-hidden shadow-lg aspect-[9/16] relative group flex items-center justify-center border border-slate-800">
               {videoUrl ? (
                 <>
                   <video 
                     ref={videoRef} 
                     src={videoUrl} 
                     className="w-full h-full object-contain" 
                     controls 
                     crossOrigin="anonymous"
                   />
                   <canvas ref={canvasRef} className="hidden" />
                 </>
               ) : (
                 <label className="cursor-pointer flex flex-col items-center justify-center p-8 text-slate-500 hover:text-white transition-colors w-full h-full">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:bg-slate-700">
                       <Video className="w-8 h-8" />
                    </div>
                    <span className="font-semibold">Upload Video (MP4)</span>
                    <span className="text-xs opacity-70 mt-1">Max 50MB</span>
                    <input type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={handleFileChange} />
                 </label>
               )}
            </div>
            
            <button 
               onClick={handleAnalyze}
               disabled={!videoUrl || isAnalyzing}
               className={`w-full py-4 rounded-xl font-bold text-lg text-white flex items-center justify-center gap-2 transition-all shadow-lg ${
                  !videoUrl || isAnalyzing ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
               }`}
            >
               {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
               {isAnalyzing ? 'Analyzing Visuals...' : 'Analyze Video & Generate Magic'}
            </button>
         </div>

         {/* Right: AI Output */}
         <div className="flex flex-col gap-6">
            
            {/* 1. Music Matcher */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Music className="w-24 h-24 text-indigo-600" />
               </div>
               <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-indigo-600" /> Smart Music Match
               </h3>
               
               {analysis ? (
                 <div className="space-y-4 relative z-10">
                    <div className="flex gap-2 flex-wrap">
                       <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">Mood: {analysis.music.mood}</span>
                       <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">Genre: {analysis.music.genre}</span>
                       <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">Tempo: {analysis.music.tempo}</span>
                    </div>
                    <p className="text-sm text-slate-600 italic">"{analysis.music.reasoning}"</p>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Recommended Search Query</label>
                       <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-900">{analysis.music.searchQuery}</span>
                          <button 
                             onClick={() => copyToClipboard(analysis.music.searchQuery, 'music')}
                             className="text-slate-400 hover:text-indigo-600"
                          >
                             {copiedSection === 'music' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                       </div>
                       <a 
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(analysis.music.searchQuery + " no copyright music")}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                       >
                          Find on YouTube <Sparkles className="w-3 h-3 ml-1" />
                       </a>
                    </div>
                 </div>
               ) : (
                 <div className="text-center py-8 text-slate-400 text-sm">
                    Upload and analyze a video to get music recommendations.
                 </div>
               )}
            </div>

            {/* 2. Voiceover Studio */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-red-600" /> AI Voiceover Studio
               </h3>
               
               <div className="space-y-4">
                  <div>
                     <div className="flex justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700">Script</label>
                        <select 
                           value={selectedVoice} 
                           onChange={(e) => setSelectedVoice(e.target.value)}
                           className="text-xs border rounded p-1 bg-slate-50"
                        >
                           <option value="Kore">Kore (Female, Warm)</option>
                           <option value="Puck">Puck (Male, Energetic)</option>
                           <option value="Fenrir">Fenrir (Male, Deep)</option>
                           <option value="Aoede">Aoede (Female, Soft)</option>
                        </select>
                     </div>
                     <textarea 
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        placeholder="AI will generate a script here, or write your own..."
                        rows={3}
                        className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 text-sm outline-none resize-none"
                     />
                  </div>
                  
                  <div className="flex items-center gap-3">
                     <button 
                        onClick={handleGenerateAudio}
                        disabled={!script || isGeneratingAudio}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-all ${
                           !script || isGeneratingAudio ? 'bg-slate-300' : 'bg-red-600 hover:bg-red-700'
                        }`}
                     >
                        {isGeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                        Generate Audio
                     </button>
                     
                     {generatedAudioUrl && (
                        <>
                           <button 
                              onClick={toggleAudio}
                              className="p-2.5 rounded-lg bg-slate-100 text-slate-900 hover:bg-slate-200"
                           >
                              {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                           </button>
                           <a 
                              href={generatedAudioUrl}
                              download="voiceover.wav"
                              className="p-2.5 rounded-lg bg-slate-100 text-slate-900 hover:bg-slate-200"
                           >
                              <Download className="w-4 h-4" />
                           </a>
                           <audio ref={audioRef} src={generatedAudioUrl} onEnded={() => setIsPlayingAudio(false)} className="hidden" />
                        </>
                     )}
                  </div>
               </div>
            </div>

            {/* 3. Social Data */}
            {analysis && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" /> Social Metadata
                 </h3>
                 <div className="space-y-4">
                    <CopyField label="Title" value={analysis.social.title} />
                    <CopyField label="Caption" value={analysis.social.caption} multiline />
                    <div>
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Hashtags</label>
                       <div className="flex flex-wrap gap-2">
                          {analysis.social.hashtags.map(tag => (
                             <span key={tag} className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md text-xs font-medium">{tag}</span>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

const CopyField: React.FC<{ label: string; value: string; multiline?: boolean }> = ({ label, value, multiline }) => {
   const [copied, setCopied] = useState(false);
   const handleCopy = () => {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };

   return (
      <div className="relative group">
         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">{label}</label>
         <div className={`w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 ${multiline ? 'min-h-[80px]' : ''}`}>
            {value}
         </div>
         <button 
            onClick={handleCopy}
            className="absolute top-6 right-2 p-1.5 bg-white shadow-sm border border-slate-200 rounded-md text-slate-400 hover:text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"
         >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
         </button>
      </div>
   );
};

export default VideoAlchemist;
