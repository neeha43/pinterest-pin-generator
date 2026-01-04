import { GoogleGenAI, Type } from "@google/genai";
import { WizardAnswers, PinResult } from "../types";

// Helper to get a fresh client instance. 
// Important: process.env.API_KEY might change if the user selects a new key via window.aistudio
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const MOCK_VIDEO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

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

export const generateQuotes = async (metaphors: string[], virtues: string[], count: number): Promise<{ quote: string, title: string }[]> => {
  const ai = getAiClient();
  if (!ai) {
    // Mock quotes if no API key
    return Array(count).fill({ 
        quote: "The mountain stands tall not because it tries, but because it simply is.", 
        title: "Be like the mountain" 
    });
  }

  const metaphorStr = metaphors.length > 0 ? metaphors.join(', ') : "Nature elements (river, mountain, etc.)";
  const virtueStr = virtues.length > 0 ? virtues.join(', ') : "Spiritual wisdom (patience, peace, etc.)";

  const prompt = `
    Generate ${count} unique, profound, and short quotes suitable for Instagram Reels or YouTube Shorts.
    
    Ingredients:
    - Metaphors to use: ${metaphorStr}
    - Virtues to explore: ${virtueStr}
    
    Style Guidelines & Examples:
    1. Quote: "A gentle touch softens hardened hearts. So does a kind word." -> Title: "Kindness is stronger than anger"
    2. Quote: "Even in winter, the seed sleeps for spring." -> Title: "Hope is always growing inside you"
    3. Quote: "The sun does not favor one flower over another; it shines equally on all." -> Title: "Stop comparing yourself to others"
    4. Quote: "Silence speaks louder than chaos." -> Title: "Learn to listen in silence"
    5. Quote: "Even a small candle can light the darkest room. Your kindness can brighten a soul." -> Title: "Small acts can change the world"

    Format Requirements:
    - Quote: Poetic, mystical, concise (under 20 words).
    - Title: A catchy, viral-style hook or summary for the video title (under 6 words).
    
    Return ONLY a JSON array of objects with keys "quote" and "title".
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
              quote: { type: Type.STRING },
              title: { type: Type.STRING }
            },
            required: ["quote", "title"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (e) {
    console.error("Quote generation failed", e);
    return [{ quote: "Error generating quotes. Please try again.", title: "Error" }];
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
    
    Requirement:
    Return an image only. Do not provide a text description.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: imagePrompt }] },
      config: {
        imageConfig: {
          aspectRatio: "9:16", 
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') {
      console.warn("Image generation blocked by safety filters");
      throw new Error("Safety Block");
    }

    for (const part of candidate?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }
    }
    
    // Check for text refusal
    const textPart = candidate?.content?.parts?.find(p => p.text);
    if (textPart?.text) {
       console.warn("Image generation returned text instead of image:", textPart.text);
       throw new Error(`Model Refusal: ${textPart.text.substring(0, 50)}...`);
    }

    throw new Error("No image data returned");
  } catch (error) {
    console.error("Image generation failed", error);
    return ""; 
  }
};

export const generateImageFromPrompt = async (
  prompt: string, 
  style: string, 
  model: string, 
  seed?: number,
  aspectRatio: string = "1:1"
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) {
    // Mock response for testing without API Key
    return "";
  }

  // Simplified prompt construction
  // We avoid conversational framing like "Generate an image" which might confuse the model into chat mode
  let finalPrompt = prompt;
  if (style && style !== 'None') {
      finalPrompt = `${style} style. ${prompt}`;
  }
  // Strong negative instruction against text, appended as a requirement
  finalPrompt += "\n\nRequirement: Return an image only. Do not generate any text response.";

  try {
    // Branch based on model type
    if (model.startsWith('imagen')) {
       // Imagen Model Logic
       const response = await ai.models.generateImages({
          model: model,
          prompt: finalPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: aspectRatio,
          },
       });
       
       const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
       if (imageBytes) {
          return imageBytes;
       }
       throw new Error("No image data returned from Imagen model");
       
    } else {
       // Gemini Model Logic
       const config: any = {
           imageConfig: { aspectRatio: aspectRatio },
           seed: seed
       };
       
       if (model === 'gemini-3-pro-image-preview') {
           config.imageConfig.imageSize = '1K';
       }

       const response = await ai.models.generateContent({
          model: model,
          contents: { parts: [{ text: finalPrompt }] },
          config: config
        });

        if (!response.candidates || response.candidates.length === 0) {
            throw new Error("No candidates returned. The request might have been blocked or the model is overloaded.");
        }

        const candidate = response.candidates[0];

        // Check for safety blocking
        if (candidate.finishReason === 'SAFETY') {
             throw new Error("Image generation blocked by safety filters. Please try a different prompt.");
        }

        const parts = candidate.content?.parts || [];

        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return part.inlineData.data;
          }
        }

        const textParts = parts.filter(p => p.text).map(p => p.text).join(' ');
        if (textParts) {
            throw new Error(`Model returned text instead of image: "${textParts.substring(0, 100)}..."`);
        }
        
        throw new Error(`No image data returned from API (Finish Reason: ${candidate.finishReason})`);
    }

  } catch (error) {
    console.error("Standalone image generation failed", error);
    throw error;
  }
};

/**
 * Adds text overlay to an existing image using Gemini 2.5 Flash Image editing capabilities.
 */
export const editImageWithTextOverlay = async (
  base64Image: string, 
  text: string, 
  stylingInstructions: string
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) throw new Error("No API Key");

  const prompt = `
    Edit this image by adding the following text to it: "${text}".
    
    Styling Instructions: ${stylingInstructions}
    
    Requirements:
    - The text must be legible and clear.
    - Maintain the original subject matter of the image.
    - Blend the typography artistically with the scene.
    - Return only the edited image. Do not explain the edit.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Image
            }
          },
          { text: prompt }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') {
        throw new Error("Image editing blocked by safety filters.");
    }

    const parts = candidate?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }
    }
    
    const textPart = parts.find(p => p.text);
    if (textPart?.text) {
        throw new Error(`Model refused to edit image: ${textPart.text}`);
    }

    throw new Error("No image returned from editing request");
  } catch (error) {
    console.error("Image editing failed", error);
    throw error;
  }
};

/**
 * Generates an animated video where text appears on the provided image using Veo.
 */
export const generateTextAnimationVideo = async (
  base64Image: string,
  text: string,
  styling: string
): Promise<string> => {
  const ai = getAiClient();
  
  if (!ai) {
      console.warn("No API Key, returning mock video");
      return MOCK_VIDEO_URL;
  }

  const prompt = `
    A cinematic video starting from the provided image. 
    The text "${text}" animates into view elegantly.
    
    Style/Mood: ${styling}.
    
    Requirements:
    - Keep the original subject matter stable.
    - High quality text rendering.
    - Smooth animation of the text appearance.
  `;

  try {
     let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: base64Image,
        mimeType: 'image/png', 
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9' // Defaulting to 16:9 for Veo fast
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("No video URI returned");

    // Fetch the video content
    const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    if (!response.ok) throw new Error("Failed to download video");
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error: any) {
    // Robust error string extraction to handle various Error object structures
    const msg = error.message || 
                (error.error && error.error.message) || 
                JSON.stringify(error);
                
    console.log("Caught video gen error:", msg); // Log for debug but not error level to avoid noise if fallback works

    // Fallback to mock for 404 (Not Found / No Access) or 403 (Permission) errors to satisfy "free" request
    if (msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('Requested entity was not found') || msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
        console.warn("Veo API unavailable (likely due to free tier restrictions or preview access). Using mock video.");
        return MOCK_VIDEO_URL;
    }
    
    console.error("Video generation failed hard", error);
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