import { GoogleGenAI } from '@google/genai';

export async function createAgentInteraction(prompt: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    const interaction = await ai.interactions.create(
      {
        agent: 'antigravity-preview-09-2026',
        input: prompt,
        environment: 'remote'
      },
      { timeout: 300000 }
    );

    return interaction;
  } catch (error) {
    console.error('Error creating agent interaction:', error);
    throw error;
  }
}
