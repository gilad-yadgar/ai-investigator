# Integration Test Scripts

## Ollama Service Integration Test

Test the OllamaService with real Ollama integration (no mocking).

### Prerequisites

1. Make sure Ollama is installed and running:
   ```bash
   # Install Ollama (if not already installed)
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Start Ollama service
   ollama serve
   
   # Pull the required model (in another terminal)
   ollama pull gpt-oss:20b
   ```

2. Verify Ollama is accessible:
   ```bash
   curl http://localhost:11434/api/version
   ```

### Usage

#### Interactive Mode
```bash
# Run interactive test (ask questions interactively)
npm run test:ollama

# Or directly with ts-node
npx ts-node scripts/test-ollama-integration.ts
```

#### Quick Test Mode
```bash
# Test with a specific query
npm run test:ollama-quick "What did you do last night?"

# Or directly with ts-node
npx ts-node scripts/test-ollama-integration.ts "Tell me about yourself"
```

### Features

- ✅ **Real Ollama Integration**: Tests actual service without mocking
- 🔄 **Streaming Display**: Shows tokens as they arrive in real-time
- 📊 **Performance Stats**: Displays token count, response time, tokens/sec
- 💬 **Interactive Mode**: Continue conversation with maintained history
- 🛠️ **Connection Testing**: Verifies Ollama service availability
- 📝 **History Tracking**: Shows conversation history length

### Example Output

```
🔍 OllamaService Integration Test
================================

Testing Ollama connection...
✅ Ollama service is available

💬 Interactive mode - ask questions to test streaming responses
Type "quit" to exit

Enter your question (or "quit" to exit): What did you do last night?

📤 Query: "What did you do last night?"
🔄 Streaming response:

I was home all evening, just working on some code...

──────────────────────────────────────────────────
✅ Response complete!
📊 Stats:
   • Tokens: 12
   • Time: 1247ms
   • Tokens/sec: 9.62
   • Full response length: 67 characters
──────────────────────────────────────────────────

📝 Conversation history: 2 messages
```

### Troubleshooting

- **Connection Failed**: Ensure Ollama is running on `http://localhost:11434`
- **Model Not Found**: Pull the required model with `ollama pull gpt-oss:20b`
- **Slow Response**: This is normal for first requests as models load into memory
