
import { GoogleGenAI, Type } from "@google/genai";

// Create the client only when a secure service is configured.
const getAI = () => {
  if (!process.env.API_KEY || process.env.API_KEY === 'PLACEHOLDER_API_KEY') {
    throw new Error('المساعد الصوتي والذكي يحتاجان ربط Gemini عبر خدمة آمنة.');
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getLegalAssistantResponse = async (userPrompt: string) => {
  if (!process.env.API_KEY) return 'المستشار الذكي غير مفعّل في هذه النسخة؛ يلزم ربط Gemini بأمان أولاً.';
  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userPrompt,
      config: {
        systemInstruction: `You are an expert on Swedish Immigration Law.
        Respond ONLY in Arabic.
        Always start your response with a clear disclaimer that this is educational content and not legal advice.
        Direct users to www.migrationsverket.se for official information.
        Be concise, empathetic, and clear.
        Avoid giving definitive personal legal advice; explain general rules and laws.`,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.";
  }
};

export const generateEpisodeSummaryAudio = async (text: string) => {
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `اقرأ بصوت واضح وهادئ: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

// Audio decoding helper
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
