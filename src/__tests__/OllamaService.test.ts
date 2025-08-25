import { OllamaService } from '../services/OllamaService';
import { OllamaResponse, OllamaStreamResponse } from '../types/DialogTypes';

// Mock the suspect profile
jest.mock('../characters/suspect', () => ({
  suspectProfile: 'Mock suspect profile for testing'
}));

describe('OllamaService', () => {
  let ollamaService: OllamaService;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    ollamaService = new OllamaService();
    jest.clearAllMocks();
  });

  describe('generateStreamingResponse', () => {
    it('should send message and receive non-streaming response', async () => {
      // Arrange
      const testPrompt = 'What did you do last night?';
      const expectedResponse = 'I was home all evening.';
      const mockOllamaResponse: OllamaResponse = {
        response: expectedResponse,
        done: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockOllamaResponse)
      } as any);

      // Act
      const result = await ollamaService.generateStreamingResponse(testPrompt, jest.fn(), jest.fn(), jest.fn());

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-oss:20b',
            messages: [
              {
                role: 'system',
                content: 'Mock suspect profile for testing'
              },
              {
                role: 'user',
                content: testPrompt
              }
            ],
            stream: false,
            options: {
              temperature: 0.7,
              max_tokens: 150
            }
          })
        }
      );

      expect(result).toBe(expectedResponse);
      
      // Check that conversation history was updated
      const history = ollamaService.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({
        speaker: 'investigator',
        text: testPrompt,
        timestamp: expect.any(Date)
      });
      expect(history[1]).toEqual({
        speaker: 'suspect',
        text: expectedResponse,
        timestamp: expect.any(Date)
      });
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const testPrompt = 'Test error handling';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      } as any);

      // Act & Assert
      await expect(ollamaService.generateStreamingResponse(testPrompt, jest.fn(), jest.fn(), jest.fn())).rejects.toThrow('Bad response status');
      
      // Check that user message was still added to history
      const history = ollamaService.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].speaker).toBe('investigator');
      expect(history[0].text).toBe(testPrompt);
    });

    it('should handle network errors', async () => {
      // Arrange
      const testPrompt = 'Test network error';
      const networkError = new Error('Network error');
      
      mockFetch.mockRejectedValueOnce(networkError);

      // Act & Assert
      await expect(ollamaService.generateStreamingResponse(testPrompt, jest.fn(), jest.fn(), jest.fn())).rejects.toThrow('Network error');
    });
  });

  describe('generateStreamingResponse', () => {
    it('should send message and receive streaming response', async () => {
      // Arrange
      const testPrompt = 'Tell me about your day';
      const streamChunks = [
        '{"model":"gpt-oss:20b","created_at":"2024-01-01","response":"I ","done":false}\n',
        '{"model":"gpt-oss:20b","created_at":"2024-01-01","response":"had ","done":false}\n',
        '{"model":"gpt-oss:20b","created_at":"2024-01-01","response":"a normal ","done":false}\n',
        '{"model":"gpt-oss:20b","created_at":"2024-01-01","response":"day.","done":true}\n'
      ];

      const onChunk = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      // Mock ReadableStream
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(streamChunks[0])
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(streamChunks[1])
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(streamChunks[2])
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(streamChunks[3])
          })
          .mockResolvedValueOnce({
            done: true
          }),
        releaseLock: jest.fn()
      };

      const mockBody = {
        getReader: jest.fn().mockReturnValue(mockReader)
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: mockBody
      } as any);

      // Act
      await ollamaService.generateStreamingResponse(testPrompt, onChunk, onComplete, onError);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-oss:20b',
            messages: [
              {
                role: 'system',
                content: 'Mock suspect profile for testing'
              },
              {
                role: 'user',
                content: testPrompt
              }
            ],
            stream: true,
            options: {
              temperature: 0.7,
              max_tokens: 50
            }
          })
        }
      );

      expect(onChunk).toHaveBeenCalledTimes(4);
      expect(onChunk).toHaveBeenNthCalledWith(1, 'I ');
      expect(onChunk).toHaveBeenNthCalledWith(2, 'had ');
      expect(onChunk).toHaveBeenNthCalledWith(3, 'a normal ');
      expect(onChunk).toHaveBeenNthCalledWith(4, 'day.');

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith('I had a normal day.');

      expect(onError).not.toHaveBeenCalled();

      // Check that conversation history was updated
      const history = ollamaService.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({
        speaker: 'investigator',
        text: testPrompt,
        timestamp: expect.any(Date)
      });
      expect(history[1]).toEqual({
        speaker: 'suspect',
        text: 'I had a normal day.',
        timestamp: expect.any(Date)
      });
    });

    it('should handle streaming API errors', async () => {
      // Arrange
      const testPrompt = 'Test streaming error';
      const onChunk = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503
      } as any);

      // Act
      await ollamaService.generateStreamingResponse(testPrompt, onChunk, onComplete, onError);

      // Assert
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith("I'm not feeling well... can we continue this later?");
      expect(onChunk).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should handle missing response body', async () => {
      // Arrange
      const testPrompt = 'Test missing body';
      const onChunk = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        body: null
      } as any);

      // Act
      await ollamaService.generateStreamingResponse(testPrompt, onChunk, onComplete, onError);

      // Assert
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith("I... I don't know what to say.");
      expect(onChunk).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('should handle network errors in streaming', async () => {
      // Arrange
      const testPrompt = 'Test streaming network error';
      const onChunk = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();
      
      const networkError = new TypeError('fetch failed');
      mockFetch.mockRejectedValueOnce(networkError);

      // Act
      await ollamaService.generateStreamingResponse(testPrompt, onChunk, onComplete, onError);

      // Assert
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith('[Ollama not available - using fallback] I... I need a lawyer.');
      expect(onChunk).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('conversation history management', () => {
    it('should maintain conversation history across multiple interactions', async () => {
      // Arrange
      const mockResponse1: OllamaResponse = { response: 'First response', done: true };
      const mockResponse2: OllamaResponse = { response: 'Second response', done: true };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValueOnce(mockResponse1)
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValueOnce(mockResponse2)
        } as any);

      // Act
      await ollamaService.generateStreamingResponse('First question', jest.fn(), jest.fn(), jest.fn());
      await ollamaService.generateStreamingResponse('Second question', jest.fn(), jest.fn(), jest.fn());

      // Assert
      const history = ollamaService.getHistory();
      expect(history).toHaveLength(4);
      
      expect(history[0].speaker).toBe('investigator');
      expect(history[0].text).toBe('First question');
      
      expect(history[1].speaker).toBe('suspect');
      expect(history[1].text).toBe('First response');
      
      expect(history[2].speaker).toBe('investigator');
      expect(history[2].text).toBe('Second question');
      
      expect(history[3].speaker).toBe('suspect');
      expect(history[3].text).toBe('Second response');
    });

    it('should include conversation history in subsequent requests', async () => {
      // Arrange
      const mockResponse: OllamaResponse = { response: 'Response', done: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockResponse)
      } as any);

      // Act
      await ollamaService.generateStreamingResponse('First question', jest.fn(), jest.fn(), jest.fn());
      await ollamaService.generateStreamingResponse('Second question', jest.fn(), jest.fn(), jest.fn());

      // Assert - Check the second request includes history
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      const secondCallArgs = mockFetch.mock.calls[1];
      const secondRequestBody = JSON.parse(secondCallArgs[1]!.body as string);
      
      expect(secondRequestBody.messages).toEqual([
        {
          role: 'system',
          content: 'Mock suspect profile for testing'
        },
        {
          role: 'user',
          content: 'First question'
        },
        {
          role: 'assistant',
          content: 'Response'
        },
        {
          role: 'user',
          content: 'Second question'
        }
      ]);
    });

    it('should clear history when requested', () => {
      // Arrange
      ollamaService.addMessage('investigator', 'Test message');
      expect(ollamaService.getHistoryLength()).toBe(1);

      // Act
      ollamaService.clearHistory();

      // Assert
      expect(ollamaService.getHistoryLength()).toBe(0);
      expect(ollamaService.getHistory()).toEqual([]);
    });
  });

  describe('testConnection', () => {
    it('should return true when Ollama is available', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: true
      } as any);

      // Act
      const result = await ollamaService.testConnection();

      // Assert
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:11434/api/version');
    });

    it('should return false when Ollama is not available', async () => {
      // Arrange
      mockFetch.mockResolvedValueOnce({
        ok: false
      } as any);

      // Act
      const result = await ollamaService.testConnection();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when network request fails', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act
      const result = await ollamaService.testConnection();

      // Assert
      expect(result).toBe(false);
    });
  });
});
