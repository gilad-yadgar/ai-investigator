import ollama from 'ollama';
import { OllamaRequest, OllamaResponse, OllamaStreamResponse, ConversationEntry, ChatMessage } from '../types/DialogTypes';
import { suspectProfile } from '../characters/suspect';

export class OllamaService {
  private readonly model: string = 'gemma3:4b';
  private conversationHistory: ConversationEntry[] = [];

  constructor() {
    console.log('[OllamaService] Initialized with model:', this.model);
    console.log('[OllamaService] Suspect profile loaded');
  }

  /**
   * Add a message to the conversation history
   */
  addMessage(speaker: 'investigator' | 'suspect', text: string): void {
    this.conversationHistory.push({
      speaker,
      text,
      timestamp: new Date()
    });
    console.log(`[OllamaService] Added ${speaker} message to history:`, text);
  }

  /**
   * Clear the conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
    console.log('[OllamaService] Conversation history cleared');
  }

  /**
   * Get a copy of the current conversation history
   */
  getHistory(): ConversationEntry[] {
    return [...this.conversationHistory];
  }

  /**
   * Get the number of messages in history
   */
  getHistoryLength(): number {
    return this.conversationHistory.length;
  }


  async generateStreamingResponse(
    prompt: string, 
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string, emotion?: 'angry' | 'scared' | 'bored') => void,
    onError: (error: string) => void
  ): Promise<void> {
    console.log(`[OllamaService] Generating streaming response for: ${prompt.substring(0, 50)}...`);

    // Add the user's message to history
    this.addMessage('investigator', prompt);

    const messages = this.buildMessages(prompt);

    try {
      console.log('[OllamaService] Making streaming request to Ollama...');
      
      let fullResponse = '';
      let bufferedResponse = '';
      let emotionParsed = false;
      let detectedEmotion: 'angry' | 'scared' | 'bored' | undefined = undefined;
      let sentResponseChars = 0; // Track how much response text we've already sent
      
      const response = await ollama.chat({
        model: this.model,
        messages: messages,
        stream: true,
        think: false,
        options: {
          temperature: 0.7,
          num_predict: 500 // equivalent to max_tokens
        }
      });

      console.log('[OllamaService] Starting to process stream...');
      let thinking = '';
      for await (const part of response) {
        
        // Log thinking process for debugging (but don't send to user)
        if (part.message.thinking) {
          thinking += part.message.thinking;
        }
        else {
          console.log('[OllamaService] Raw part:', JSON.stringify(part, null, 2));
          const chunk = part.message.content || '';
          // Debug: Log what we're extracting
          console.log('[OllamaService] Extracted chunk:', JSON.stringify(chunk));
          if (chunk) {
            fullResponse += chunk;
            bufferedResponse += chunk;
            
            // Try to parse emotion from buffered response
            if (!emotionParsed && bufferedResponse.includes('\n')) {
              const lines = bufferedResponse.split('\n').map(line => line.trim()).filter(line => line.length > 0);
              
              if (lines.length >= 1) {
                const firstLine = lines[0].toLowerCase();
                if (firstLine === 'angry' || firstLine === 'scared' || firstLine === 'bored') {
                  detectedEmotion = firstLine as 'angry' | 'scared' | 'bored';
                  emotionParsed = true;
                  console.log('[OllamaService] Detected emotion during streaming:', detectedEmotion);
                  
                  // Get all response text after the first line
                  const responseText = bufferedResponse.substring(bufferedResponse.indexOf('\n') + 1);
                  
                  // Send any new response text that we haven't sent yet
                  const newResponseText = responseText.substring(sentResponseChars);
                  if (newResponseText) {
                    onChunk(newResponseText);
                    sentResponseChars = responseText.length;
                  }
                } else {
                  // First line is not an emotion, send all buffered content
                  onChunk(bufferedResponse);
                  emotionParsed = true; // Mark as parsed to avoid re-checking
                }
              }
            } else if (emotionParsed && detectedEmotion) {
              // Emotion already parsed, send new chunk as response text
              onChunk(chunk);
            } else if (emotionParsed && !detectedEmotion) {
              // No emotion detected, send chunk normally
              onChunk(chunk);
            } else {
              // Still building up to first newline, don't send anything yet
              // We'll send it once we determine if first line is emotion or not
            }
          }
        }
      }
      // Only send actual content to the user
      
      console.log(`[OllamaService] Thinking tokens: ${thinking}`);
      
      console.log(`[OllamaService] Stream complete, full response: ${fullResponse.substring(0, 50)}...`);
      
      const parsed = this.parseEmotionAndResponse(fullResponse);
      
      // Use detected emotion from streaming if available, otherwise use parsed emotion
      const finalEmotion = detectedEmotion || parsed.emotion;
      
      // Add the suspect's response to history
      this.addMessage('suspect', parsed.response);
      onComplete(parsed.response, finalEmotion);
      
    } catch (error) {
      console.error('[OllamaService] Streaming error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Use ollama library to list models - this tests connectivity
      await ollama.list();
      console.log('[OllamaService] Connection test: SUCCESS');
      return true;
    } catch (error) {
      console.error('[OllamaService] Connection test failed:', error);
      return false;
    }
  }

  private parseEmotionAndResponse(rawResponse: string): {response: string, emotion?: 'angry' | 'scared' | 'bored'} {
    try {
      // Split response into lines and trim whitespace
      const lines = rawResponse.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length >= 2) {
        const emotionLine = lines[0].toLowerCase();
        const responseLine = lines[1];
        
        // Check if first line is a valid emotion
        if (emotionLine === 'angry' || emotionLine === 'scared' || emotionLine === 'bored') {
          return {
            emotion: emotionLine as 'angry' | 'scared' | 'bored',
            response: responseLine
          };
        }
      }
    } catch (error) {
      console.warn('[OllamaService] Failed to parse emotion from response:', error);
    }
    
    // Fallback: return raw response without emotion
    return { response: rawResponse };
  }

  private buildMessages(userInput: string): ChatMessage[] {
    const messages: ChatMessage[] = [];
    
    // Add system message with suspect profile
    messages.push({
      role: 'system',
      content: suspectProfile
    });
    
    // Add conversation history (excluding the current user input that was just added to history)
    // We need to exclude the last investigator message since it's the current input we're processing
    const historyToUse = this.conversationHistory.slice(0, -1);
    if (historyToUse.length > 0) {
      historyToUse.forEach(entry => {
        const role = entry.speaker === 'investigator' ? 'user' : 'assistant';
        messages.push({
          role,
          content: entry.text
        });
      });
    }
    
    // Add current user input
    messages.push({
      role: 'user',
      content: userInput
    });
    
    return messages;
  }
}