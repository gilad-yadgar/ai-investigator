import { OllamaRequest, OllamaResponse } from '../types/DialogTypes';

export class OllamaService {
  private readonly baseUrl: string = 'http://localhost:11434/api/generate';
  private readonly model: string = 'gpt-oss:20b';

  constructor() {
    console.log('[OllamaService] Initialized with model:', this.model);
  }

  async generateResponse(prompt: string): Promise<string> {
    console.log(`[OllamaService] Generating response for: ${prompt.substring(0, 50)}...`);

    const fullPrompt = this.buildPrompt(prompt);
    const request: OllamaRequest = {
      model: this.model,
      prompt: fullPrompt,
      stream: false,
      options: {
        temperature: 0.7,
        max_tokens: 150
      }
    };

    try {
      console.log('[OllamaService] Making request to Ollama...');
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      console.log(`[OllamaService] Response status: ${response.status}`);

      if (response.ok) {
        const result: OllamaResponse = await response.json();
        const suspectResponse = result.response || "I... I don't know what to say.";
        console.log(`[OllamaService] Got response: ${suspectResponse.substring(0, 50)}...`);
        return suspectResponse;
      } else {
        console.error('[OllamaService] Bad response status:', response.status);
        return "I'm not feeling well... can we continue this later?";
      }
    } catch (error) {
      console.error('[OllamaService] Error:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return "[Ollama not available - using fallback] I... I need a lawyer.";
      }
      
      return `[Error: ${error instanceof Error ? error.message : 'Unknown error'}] I don't understand the question.`;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:11434/api/version');
      const isAvailable = response.ok;
      console.log('[OllamaService] Connection test:', isAvailable ? 'SUCCESS' : 'FAILED');
      return isAvailable;
    } catch (error) {
      console.error('[OllamaService] Connection test failed:', error);
      return false;
    }
  }

  private buildPrompt(userInput: string): string {
    return `You are a suspect being interrogated by a detective. You have been accused of a crime but you may or may not be guilty.

Respond naturally and realistically to the detective's questions. You can be:
- Nervous and evasive if you're hiding something
- Cooperative but confused if you're innocent
- Defensive if you feel attacked
- Sometimes contradictory under pressure

Keep responses conversational and under 100 words. Don't be overly dramatic.

Detective: ${userInput}

Suspect:`;
  }
}