import { GoogleGenAI } from "@google/genai";
import { BlindLevel } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseStructureFromFile(file: File): Promise<BlindLevel[]> {
  const isImage = file.type.startsWith('image/');
  const fileData = await readFile(file, isImage);

  const prompt = `
    You are a poker tournament director assistant. 
    Extract the poker blind structure from the provided file content.
    Return a JSON array of blind levels.
    
    The output must strictly follow this schema for each level:
    {
      "id": "string (unique)",
      "smallBlind": number (0 if break),
      "bigBlind": number (0 if break),
      "ante": number (optional),
      "duration": number (in minutes),
      "isBreak": boolean,
      "label": "string (e.g. 'Level 1', 'Break', 'Dinner Break')"
    }

    If the duration is not explicitly stated for a level, assume 15 minutes.
    If it is a break, set smallBlind and bigBlind to 0 and isBreak to true.
    If you cannot find any structure, return an empty array.
  `;

  try {
    let contentPart: any;

    if (isImage) {
      // Remove data URL prefix for API
      const base64Data = (fileData as string).split(',')[1];
      contentPart = {
        inlineData: {
          mimeType: file.type,
          data: base64Data
        }
      };
    } else {
      contentPart = {
        text: fileData as string
      };
    }

    const response = await ai.models.generateContent({
      model: isImage ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash',
      contents: {
        parts: [
          contentPart,
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return [];

    const parsed = JSON.parse(text);
    
    // Validate/Sanitize
    return parsed.map((level: any, index: number) => ({
      id: level.id || Math.random().toString(36).substr(2, 9),
      smallBlind: Number(level.smallBlind) || 0,
      bigBlind: Number(level.bigBlind) || 0,
      ante: level.ante ? Number(level.ante) : undefined,
      duration: Number(level.duration) || 15,
      isBreak: Boolean(level.isBreak),
      label: level.label || (level.isBreak ? 'Break' : `Level ${index + 1}`)
    }));

  } catch (error) {
    console.error("Error parsing structure with AI:", error);
    throw new Error("Failed to parse structure from file.");
  }
}

function readFile(file: File, isImage: boolean): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    if (isImage) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
}
