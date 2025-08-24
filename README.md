# Investigator Phaser - Visual Novel Game

A visual novel-style detective game built with Phaser 3 and TypeScript, featuring AI-powered conversations using Ollama.

## Features

### Streaming AI Responses
The game now supports **real-time streaming** of AI responses from Ollama, providing a more engaging and natural conversation experience:

- **Real-time text streaming**: AI responses appear word-by-word as they're generated
- **Visual typing indicator**: A blinking cursor shows when text is being streamed
- **Smooth animations**: Subtle visual effects enhance the streaming experience
- **Error handling**: Graceful fallbacks when Ollama is unavailable

### How Streaming Works

1. **User Input**: Player types a question or statement
2. **Streaming Request**: The game sends a streaming request to Ollama
3. **Real-time Updates**: Text chunks are received and displayed immediately
4. **Visual Feedback**: A typing cursor appears during streaming
5. **Completion**: When streaming ends, a text indicator appears

### Technical Implementation

- **OllamaService**: Handles streaming requests using the Ollama API
- **ConversationDisplay**: Manages real-time text updates and visual effects
- **GameScene**: Coordinates the streaming flow and user interactions

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start Ollama and ensure it's running on `http://localhost:11434`

3. Run the development server:
   ```bash
   npm run dev
   ```

## Development

- **Build**: `npm run build-dev`
- **Production Build**: `npm run build-prod`
- **Development Server**: `npm run dev`

## Architecture

The streaming functionality is implemented across several key components:

- **Types**: `OllamaStreamResponse` interface for streaming data
- **Service**: `generateStreamingResponse()` method in `OllamaService`
- **UI**: `updateStreamingText()` and `completeStreaming()` in `ConversationDisplay`
- **Game Logic**: Streaming coordination in `GameScene.getAIResponse()`

## Future Enhancements

- Voice synthesis for AI responses
- Multiple character support
- Save/load conversation state
- Branching dialogue paths
