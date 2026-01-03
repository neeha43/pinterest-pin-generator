import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, Sparkles, ChevronRight } from 'lucide-react';
import { WizardAnswers } from '../types';
import { NICHES, GOALS, CONTENT_TYPES, ANGLES, HEADLINE_STYLES, CTAS, VISUAL_STYLES, OUTPUT_OPTIONS } from '../constants';

interface GeneratorProps {
  onComplete: (answers: WizardAnswers) => void;
  onBack: () => void;
}

const Generator: React.FC<GeneratorProps> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 12;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Form State
  const [answers, setAnswers] = useState<WizardAnswers>({
    pin_goal: '',
    content_type: '',
    content_reference: '',
    niche: '',
    audience_profile: { age: '', gender: '', situation: '' },
    pain_point: '',
    content_angle: '',
    headline_style: '',
    cta_text: '',
    visual_style: [],
    color_mood: '',
    no_emojis: false,
    keywords: '',
    outputs: ['Pin image text (headline + CTA)', 'SEO-optimized pin title'],
    variation_count: 3
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [step]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const updateAnswer = (key: keyof WizardAnswers, value: any) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <StepCard title="What is your goal?" step={1} total={totalSteps}>
            <div className="grid gap-3">
              {GOALS.map(goal => (
                <OptionButton 
                  key={goal} 
                  selected={answers.pin_goal === goal} 
                  onClick={() => { updateAnswer('pin_goal', goal); handleNext(); }}
                >
                  {goal}
                </OptionButton>
              ))}
            </div>
          </StepCard>
        );
      case 2:
        return (
          <StepCard title="What are you promoting?" step={2} total={totalSteps}>
            <div className="space-y-6">
              <div className="grid gap-3">
                {CONTENT_TYPES.map(type => (
                  <OptionButton 
                    key={type} 
                    selected={answers.content_type === type} 
                    onClick={() => updateAnswer('content_type', type)}
                  >
                    {type}
                  </OptionButton>
                ))}
              </div>
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Page Title or URL (Optional)</label>
                 <input 
                  type="text" 
                  className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-shadow"
                  placeholder="e.g., 10 Tips for Better Sleep"
                  value={answers.content_reference}
                  onChange={(e) => updateAnswer('content_reference', e.target.value)}
                 />
              </div>
              <PrimaryButton onClick={handleNext} disabled={!answers.content_type}>Next Step</PrimaryButton>
            </div>
          </StepCard>
        );
      case 3:
        return (
          <StepCard title="Select your niche" step={3} total={totalSteps}>
             <div className="grid grid-cols-2 gap-3">
              {NICHES.map(niche => (
                <OptionButton 
                  key={niche} 
                  selected={answers.niche === niche} 
                  onClick={() => { 
                    if (niche === 'Other') {
                        updateAnswer('niche', '');
                    } else {
                        updateAnswer('niche', niche); 
                        handleNext();
                    }
                  }}
                >
                  {niche}
                </OptionButton>
              ))}
            </div>
            {/* Show input if Niche is empty (user clicked Other or cleared it) but ensure we don't trap them if they want to reselect */}
            <div className="mt-6">
               <label className="block text-sm font-medium text-slate-700 mb-2">Or type your niche:</label>
               <input 
                  type="text" 
                  className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-shadow"
                  placeholder="e.g., Woodworking, Pet Care..."
                  value={answers.niche}
                  onChange={(e) => updateAnswer('niche', e.target.value)}
                 />
            </div>
            <div className="mt-6">
               <PrimaryButton onClick={handleNext} disabled={!answers.niche}>Next Step</PrimaryButton>
            </div>
          </StepCard>
        );
      case 4:
         return (
          <StepCard title="Target Audience" step={4} total={totalSteps}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Age Range</label>
                <input 
                  type="text" 
                  placeholder="e.g., 20-35" 
                  className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                  value={answers.audience_profile.age}
                  onChange={(e) => setAnswers(prev => ({ ...prev, audience_profile: { ...prev.audience_profile, age: e.target.value } }))}
                />
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                 <div className="flex gap-3">
                    {['Any', 'Women', 'Men'].map(g => (
                      <button 
                        key={g}
                        onClick={() => setAnswers(prev => ({ ...prev, audience_profile: { ...prev.audience_profile, gender: g } }))}
                        className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${answers.audience_profile.gender === g ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-300 hover:border-slate-400'}`}
                      >
                        {g}
                      </button>
                    ))}
                 </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Situation or Interest</label>
                <input 
                  type="text" 
                  placeholder="e.g., Struggling with insomnia" 
                  className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                  value={answers.audience_profile.situation}
                  onChange={(e) => setAnswers(prev => ({ ...prev, audience_profile: { ...prev.audience_profile, situation: e.target.value } }))}
                />
              </div>
              <PrimaryButton onClick={handleNext} disabled={!answers.audience_profile.age || !answers.audience_profile.gender || !answers.audience_profile.situation}>Next Step</PrimaryButton>
            </div>
          </StepCard>
         );
      case 5:
        return (
          <StepCard title="What is the main pain point?" step={5} total={totalSteps}>
             <div className="grid gap-3">
              {[
                'I want answers',
                'I want to improve something',
                'I’m confused / overwhelmed',
                'I want quick results',
                'I want to avoid mistakes'
              ].map(opt => (
                <OptionButton 
                  key={opt} 
                  selected={answers.pain_point === opt} 
                  onClick={() => updateAnswer('pain_point', opt)}
                >
                  {opt}
                </OptionButton>
              ))}
            </div>
            <div className="mt-6">
               <label className="block text-sm font-medium text-slate-700 mb-2">Or describe in one sentence:</label>
               <input 
                  type="text" 
                  className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                  placeholder="e.g., I want to sleep better without pills"
                  value={answers.pain_point}
                  onChange={(e) => updateAnswer('pain_point', e.target.value)}
                 />
            </div>
            <div className="mt-6">
               <PrimaryButton onClick={handleNext} disabled={!answers.pain_point}>Next Step</PrimaryButton>
            </div>
          </StepCard>
        );
      case 6:
        return (
           <StepCard title="Choose an angle" step={6} total={totalSteps}>
            <div className="grid gap-3">
              {ANGLES.map(angle => (
                <OptionButton 
                  key={angle} 
                  selected={answers.content_angle === angle} 
                  onClick={() => { updateAnswer('content_angle', angle); handleNext(); }}
                >
                  {angle}
                </OptionButton>
              ))}
            </div>
          </StepCard>
        );
      case 7:
        return (
           <StepCard title="Headline style" step={7} total={totalSteps}>
            <div className="grid gap-3">
              {HEADLINE_STYLES.map(style => (
                <OptionButton 
                  key={style} 
                  selected={answers.headline_style === style} 
                  onClick={() => { updateAnswer('headline_style', style); handleNext(); }}
                >
                  {style}
                </OptionButton>
              ))}
            </div>
          </StepCard>
        );
      case 8:
        return (
          <StepCard title="Call to Action (CTA)" step={8} total={totalSteps}>
            <div className="grid gap-3">
              {CTAS.map(cta => (
                <OptionButton 
                  key={cta} 
                  selected={answers.cta_text === cta} 
                  onClick={() => { updateAnswer('cta_text', cta); handleNext(); }}
                >
                  {cta}
                </OptionButton>
              ))}
            </div>
             <div className="mt-6">
               <input 
                  type="text" 
                  className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow"
                  placeholder="Or type custom CTA..."
                  value={answers.cta_text}
                  onChange={(e) => updateAnswer('cta_text', e.target.value)}
                 />
            </div>
            <div className="mt-6">
               <PrimaryButton onClick={handleNext} disabled={!answers.cta_text}>Next Step</PrimaryButton>
            </div>
          </StepCard>
        );
      case 9:
        return (
           <StepCard title="Visual Preferences" step={9} total={totalSteps}>
             <div className="space-y-6">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Style (Select multiple)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {VISUAL_STYLES.map(style => (
                      <button
                        key={style}
                        onClick={() => {
                          const current = answers.visual_style;
                          const next = current.includes(style) 
                            ? current.filter(s => s !== style) 
                            : [...current, style];
                          updateAnswer('visual_style', next);
                        }}
                        className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${
                          answers.visual_style.includes(style)
                          ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500'
                          : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Color Mood</label>
                   <div className="flex gap-3">
                    {['Light', 'Dark', 'Neutral', 'High-contrast'].map(m => (
                      <button 
                        key={m}
                        onClick={() => updateAnswer('color_mood', m)}
                        className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-colors ${answers.color_mood === m ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-300 hover:border-slate-400'}`}
                      >
                        {m}
                      </button>
                    ))}
                 </div>
               </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="no_emojis"
                    checked={answers.no_emojis}
                    onChange={(e) => updateAnswer('no_emojis', e.target.checked)}
                    className="w-5 h-5 text-red-600 border-slate-300 rounded focus:ring-red-500"
                  />
                  <label htmlFor="no_emojis" className="text-sm font-medium text-slate-700">Avoid emojis in image text?</label>
                </div>

               <PrimaryButton onClick={handleNext} disabled={answers.visual_style.length === 0 || !answers.color_mood}>Next Step</PrimaryButton>
             </div>
           </StepCard>
        );
      case 10:
        return (
           <StepCard title="SEO Keywords" step={10} total={totalSteps}>
              <div className="space-y-6">
                <p className="text-slate-500">Enter 1–3 keywords people might search on Pinterest</p>
                <input 
                  type="text" 
                  className="w-full p-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-shadow text-lg"
                  placeholder="e.g. sleep tips, insomnia help"
                  value={answers.keywords}
                  onChange={(e) => updateAnswer('keywords', e.target.value)}
                 />
                 <PrimaryButton onClick={handleNext} disabled={!answers.keywords}>Next Step</PrimaryButton>
              </div>
           </StepCard>
        );
      case 11:
         return (
           <StepCard title="Generation settings" step={11} total={totalSteps}>
             <div className="space-y-6">
                <div className="space-y-2">
                   {OUTPUT_OPTIONS.map(opt => (
                     <div key={opt} className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => {
                        const current = answers.outputs;
                        const next = current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt];
                        updateAnswer('outputs', next);
                     }}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${answers.outputs.includes(opt) ? 'bg-red-600 border-red-600' : 'border-slate-300'}`}>
                           {answers.outputs.includes(opt) && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="text-slate-700 font-medium">{opt}</span>
                     </div>
                   ))}
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-2">Number of variations</label>
                   <div className="flex gap-4">
                      {[1, 3, 5].map(count => (
                         <button 
                            key={count}
                            onClick={() => updateAnswer('variation_count', count)}
                            className={`flex-1 py-3 rounded-xl border text-lg font-bold transition-all ${answers.variation_count === count ? 'bg-red-50 border-red-500 text-red-600' : 'border-slate-300 text-slate-500 hover:border-slate-400'}`}
                         >
                            {count}
                         </button>
                      ))}
                   </div>
                </div>
                 <PrimaryButton onClick={handleNext} disabled={answers.outputs.length === 0}>Next Step</PrimaryButton>
             </div>
           </StepCard>
         );
      case 12:
         return (
            <StepCard title="Ready to generate?" step={12} total={totalSteps}>
               <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                     <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        I'm generating pins that are:
                     </h3>
                     <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-slate-600">
                           <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">✓</div>
                           Mobile-first & High-click potential
                        </li>
                        <li className="flex items-center gap-3 text-slate-600">
                           <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">✓</div>
                           SEO-optimized for: <span className="font-semibold text-slate-800">{answers.keywords}</span>
                        </li>
                         <li className="flex items-center gap-3 text-slate-600">
                           <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">✓</div>
                           Matched to niche: <span className="font-semibold text-slate-800">{answers.niche}</span>
                        </li>
                     </ul>
                  </div>
                   <button 
                      onClick={handleNext}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-5 h-5" />
                      Generate My Pinterest Pins
                    </button>
               </div>
            </StepCard>
         );
      default:
        return null;
    }
  };

  return (
    <div className="w-full bg-slate-50 flex flex-col items-center pt-8 pb-20 px-4 min-h-full">
      <div className="w-full max-w-2xl">
         {/* Header / Nav */}
         <div className="flex items-center justify-between mb-8">
            <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors">
               <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
               Step {step} of {totalSteps}
            </div>
         </div>

         {/* Progress Bar */}
         <div className="h-1.5 bg-slate-200 rounded-full mb-8 overflow-hidden">
            <div 
               className="h-full bg-red-600 transition-all duration-500 ease-out"
               style={{ width: `${(step / totalSteps) * 100}%` }}
            />
         </div>

         {/* Steps */}
         <div ref={scrollRef}>
            {renderStep()}
         </div>
      </div>
    </div>
  );
};

// UI Components for Generator
const StepCard: React.FC<{ title: string; children: React.ReactNode; step: number; total: number }> = ({ title, children, step }) => (
  <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h2 className="text-3xl font-bold text-slate-900 mb-6 leading-tight">{title}</h2>
    {children}
  </div>
);

const OptionButton: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({ selected, onClick, children }) => (
  <button
    onClick={onClick}
    className={`w-full p-4 rounded-xl border text-left font-medium transition-all duration-200 flex items-center justify-between group ${
      selected 
      ? 'border-red-600 bg-red-50 text-red-700 shadow-sm' 
      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
    }`}
  >
    {children}
    {selected && <Check className="w-5 h-5 text-red-600" />}
    {!selected && <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-red-200" />}
  </button>
);

const PrimaryButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
      disabled 
      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
      : 'bg-slate-900 text-white hover:bg-black hover:shadow-lg'
    }`}
  >
    {children}
  </button>
);

export default Generator;