
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MeetingNotes } from '../types';
import { GEMINI_MODEL_NAME, SUMMARIZATION_SYSTEM_INSTRUCTION } from '../constants';

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please ensure it's configured for the application to function.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

// Helper function to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Result is Data URL: data:[<mediatype>][;base64],<data>
        // We need to strip the prefix (e.g., "data:audio/wav;base64,")
        const base64String = reader.result.split(',')[1];
        if (base64String) {
          resolve(base64String);
        } else {
          reject(new Error("Failed to extract base64 string from data URL."));
        }
      } else {
        reject(new Error("Failed to read blob as a data URL string."));
      }
    };
    reader.onerror = (error) => reject(new Error(`FileReader error: ${error}`));
    reader.readAsDataURL(blob);
  });
};

export const transcribeAudio = async (audioBlob: Blob, mimeType: string): Promise<string> => {
  const client = getAiClient();
  try {
    const base64AudioString = await blobToBase64(audioBlob);

    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: base64AudioString,
      },
    };

    // Prompt instructing the model to transcribe the audio.
    const textPart = {
      text: "Transcribe the following audio recording. Provide only the transcribed text. If the audio is silent or contains no discernible speech, return an empty string or a concise note like '[no speech detected]'. Do not add any conversational filler or commentary before or after the transcription.",
    };

    const response: GenerateContentResponse = await client.models.generateContent({
      model: GEMINI_MODEL_NAME, 
      contents: { parts: [audioPart, textPart] },
      // Consider disabling thinking for potentially faster transcription if quality is acceptable,
      // but test thoroughly as it might impact accuracy.
      // config: { thinkingConfig: { thinkingBudget: 0 } } 
    });

    // Directly return the transcribed text.
    // The prompt asks for minimal formatting, so .trim() should be sufficient.
    return response.text.trim();

  } catch (error) {
    console.error("Error calling Gemini API for transcription:", error);
    if (error instanceof Error) {
      throw new Error(`Gemini API transcription request failed: ${error.message}. Check your API key and network connection.`);
    }
    throw new Error("An unknown error occurred while transcribing the audio with the Gemini API.");
  }
};


export const summarizeTranscript = async (transcript: string): Promise<MeetingNotes> => {
  const client = getAiClient();

  try {
    const response: GenerateContentResponse = await client.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: transcript, 
      config: {
        systemInstruction: SUMMARIZATION_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      }
    });
    
    let jsonString = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonString.match(fenceRegex);
    if (match && match[2]) {
      jsonString = match[2].trim();
    }

    try {
      const parsedData = JSON.parse(jsonString);
      if (
        typeof parsedData.summary === 'string' &&
        Array.isArray(parsedData.actionItems) &&
        Array.isArray(parsedData.discussionHighlights) &&
        Array.isArray(parsedData.followUps)
      ) {
        return parsedData as MeetingNotes;
      } else {
        console.error("Parsed JSON does not match MeetingNotes structure:", parsedData);
        throw new Error("Received an incorrectly structured JSON response from the AI for summarization.");
      }
    } catch (e) {
      console.error("Failed to parse JSON response for summarization:", jsonString, e);
      throw new Error("The AI returned an invalid JSON response for summarization. Please try again or rephrase your input.");
    }

  } catch (error) {
    console.error("Error calling Gemini API for summarization:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API summarization request failed: ${error.message}. Check your API key and network connection.`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API for summarization.");
  }
};
