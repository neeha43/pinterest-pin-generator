import { GoogleGenAI, Type } from "@google/genai";
import { WizardAnswers, PinResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePinCopy = async (answers: WizardAnswers): Promise<Omit<PinResult, 'id' | 'isGeneratingImage'>[]> => {
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
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON", e);
    throw new Error("Failed to parse AI response");
  }
};

export const generatePinImage = async (answers: WizardAnswers, pinDetails: PinResult): Promise<string> => {
  // Construct a vivid prompt for the image generator
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
          aspectRatio: "9:16", // Closest to Pinterest 2:3 standard in available options
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
    return ""; // Return empty string on failure to handle gracefully in UI
  }
};
