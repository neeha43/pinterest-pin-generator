import { GoogleGenAI, Type } from "@google/genai";
import { WizardAnswers, PinResult } from "../types";

// Helper to get a fresh client instance. 
// Important: process.env.API_KEY might change if the user selects a new key via window.aistudio
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generatePinCopy = async (answers: WizardAnswers): Promise<Omit<PinResult, 'id' | 'isGeneratingImage'>[]> => {
  const ai = getAiClient();
  if (!ai) {
    console.warn("No API Key found. Using mock data.");
    return mockPinGeneration(answers);
  }

  const prompt = `
    You are a Pinterest SEO and Marketing expert.
    Generate ${answers.variation_count} distinct Pinterest pin variations based on the following strategy.
    
    Context:
    - Goal: ${answers.pin_goal}
    - Content Type: ${answers.content_type} (${answers.content_reference || 'General'})
    - Niche: ${answers.niche}
    - Audience: Age ${answers.audience_profile.age}, ${answers.audience_profile.gender}, Interest: ${answers.audience_profile.situation}
    - Pain Point: ${answers.pain_point}
    - Angle: ${answers.content_angle}
    - Headline Style: ${answers.headline_style}
    - CTA: ${answers.cta_text}
    - Visual Style: ${answers.visual_style.join(', ')} (Mood: ${answers.color_mood})
    - Keywords provided: ${answers.keywords}
    
    Requirements:
    1. Headlines must be mobile-first, high-click, and readable.
    2. SEO Titles and Descriptions must be optimized for Pinterest search.
    3. Generate 5-10 "Primary Keywords" (long-tail) and 5-10 "Tag Keywords" (hashtag style but no hash).
    4. Strict JSON output.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING, description: "Text on image" },
              cta: { type: Type.STRING, description: "Call to action on image" },
              title: { type: Type.STRING, description: "SEO Pin Title" },
              description: { type: Type.STRING, description: "SEO Pin Description" },
              alt_text: { type: Type.STRING, description: "Accessibility text" },
              primary_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              tag_keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["headline", "cta", "title", "description", "alt_text", "primary_keywords", "tag_keywords"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (e) {
    console.error("AI Generation failed, falling back to mock", e);
    return mockPinGeneration(answers);
  }
};

export const generatePinImage = async (answers: WizardAnswers, pinDetails: PinResult): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "";

  const imagePrompt = `
    A high-quality, professional Pinterest pin image (aspect ratio 2:3).
    Style: ${answers.visual_style.join(', ')}.
    Color Mood: ${answers.color_mood}.
    
    Content:
    The image must prominently feature the text: "${pinDetails.headline}".
    Below the headline, include a button or visual element with the text: "${pinDetails.cta}".
    
    Context:
    Niche: ${answers.niche}.
    Audience: ${answers.audience_profile.age} ${answers.audience_profile.gender}.
    Subject: ${answers.content_type} about ${answers.pain_point}.
    
    Design Guidelines:
    - Mobile-first readability: Large, bold typography.
    - Clean layout, no clutter.
    - High contrast text against background.
    - ${answers.no_emojis ? "No emojis." : "Tasteful use of icons allowed."}
    - Photorealistic or high-quality illustration as requested.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: imagePrompt,
      config: {
        imageConfig: {
          aspectRatio: "9:16", 
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error("Image generation failed", error);
    return ""; 
  }
};

export const generateImageFromPrompt = async (prompt: string, style: string, model: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) {
    // Mock response for testing without API Key
    return "";
  }

  const finalPrompt = style && style !== 'None' 
    ? `Create a ${style} style image. ${prompt}`
    : prompt;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: finalPrompt,
      config: {
        imageConfig: {
          aspectRatio: "1:1", // Square for generic generation
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error("Standalone image generation failed", error);
    throw error;
  }
};

// Mock Helper
const mockPinGeneration = (answers: WizardAnswers): Omit<PinResult, 'id' | 'isGeneratingImage'>[] => {
  return Array(answers.variation_count).fill(null).map((_, i) => ({
    headline: `Unlock Better ${answers.niche} Results Today`,
    cta: answers.cta_text || "Read More",
    title: `${answers.niche} Guide: How to Solve ${answers.pain_point} (Easy Steps)`,
    description: `Discover the secret to ${answers.pain_point} in this comprehensive guide for ${answers.audience_profile.gender || 'people'}. Perfect for ${answers.niche} lovers! #${answers.niche.replace(/\s/g, '')} #Tips`,
    alt_text: `A pin showing text about ${answers.niche} with a ${answers.visual_style[0] || 'clean'} style.`,
    primary_keywords: [answers.niche, `${answers.niche} tips`, "viral pins", "blogging tips"],
    tag_keywords: ["marketing", "growth", "ideas", "inspiration"]
  }));
};
