
export interface AudienceProfile {
  age: string;
  gender: string;
  situation: string;
}

export interface WizardAnswers {
  pin_goal: string;
  content_type: string;
  content_reference?: string;
  niche: string;
  audience_profile: AudienceProfile;
  pain_point: string;
  content_angle: string;
  headline_style: string;
  cta_text: string;
  visual_style: string[];
  color_mood: string;
  no_emojis: boolean;
  keywords: string;
  outputs: string[];
  variation_count: number;
}

export interface PinResult {
  id: string;
  headline: string;
  cta: string;
  title: string;
  description: string;
  alt_text: string;
  primary_keywords: string[];
  tag_keywords: string[];
  base64Image?: string;
  isGeneratingImage: boolean;
  createdAt?: number;
}

export interface GeneratedImage {
  id: string;
  base64: string;
  prompt: string;
  style: string;
  model: string;
  seed?: number;
  createdAt: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface VideoAnalysisResult {
  music: {
    mood: string;
    genre: string;
    tempo: string;
    searchQuery: string;
    reasoning: string;
  };
  social: {
    title: string;
    caption: string;
    hashtags: string[];
  };
  script: string;
}

export type ViewState = 'auth' | 'landing' | 'generator' | 'results' | 'history';

// Updated ActiveTab to include video-alchemist
export type ActiveTab = 'images' | 'pins' | 'text-overlay' | 'history' | 'quotes' | 'video-alchemist';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
