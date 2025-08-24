#!/usr/bin/env ts-node

import { OllamaService } from '../src/services/OllamaService';
import * as readline from 'readline';

/**
 * Integration test script for OllamaService
 * Tests real Ollama service without mocking
 * Shows streaming response tokens as they arrive
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function testOllamaIntegration(): Promise<void> {
  console.log('🔍 OllamaService Integration Test');
  console.log('================================\n');

  const ollamaService = new OllamaService();

  // Test connection first
  console.log('Testing Ollama connection...');
  const isConnected = await ollamaService.testConnection();
  
  if (!isConnected) {
    console.error('❌ Ollama service is not available at http://localhost:11434');
    console.log('Please make sure Ollama is running and try again.');
    process.exit(1);
  }

  console.log('✅ Ollama service is available\n');

  async function askQuestion(): Promise<void> {
    rl.question('Enter your question (or "quit" to exit): ', async (query: string) => {
      if (query.toLowerCase().trim() === 'quit') {
        console.log('\nGoodbye! 👋');
        rl.close();
        return;
      }

      if (!query.trim()) {
        console.log('Please enter a valid question.\n');
        askQuestion();
        return;
      }

      console.log(`\n📤 Query: "${query}"`);
      console.log('🔄 Streaming response:\n');

      let responseStartTime = Date.now();
      let tokenCount = 0;
      let fullResponse = '';

      try {
        await ollamaService.generateStreamingResponse(
          query,
          // onChunk - called for each token
          (chunk: string) => {
            process.stdout.write(chunk);
            tokenCount++;
            fullResponse += chunk;
          },
          // onComplete - called when streaming is done
          (fullResponse: string) => {
            const responseTime = Date.now() - responseStartTime;
            console.log('\n');
            console.log('─'.repeat(50));
            console.log(`✅ Response complete!`);
            console.log(`📊 Stats:`);
            console.log(`   • Tokens: ${tokenCount}`);
            console.log(`   • Time: ${responseTime}ms`);
            console.log(`   • Tokens/sec: ${(tokenCount / (responseTime / 1000)).toFixed(2)}`);
            console.log(`   • Full response length: ${fullResponse.length} characters`);
            console.log('─'.repeat(50));
            console.log(`\n📝 Conversation history: ${ollamaService.getHistoryLength()} messages\n`);
            
            askQuestion();
          },
          // onError - called if there's an error
          (error: string) => {
            console.log('\n');
            console.error(`❌ Error: ${error}`);
            console.log('');
            askQuestion();
          }
        );
      } catch (error) {
        console.log('\n');
        console.error(`❌ Unexpected error: ${error}`);
        console.log('');
        askQuestion();
      }
    });
  }

  // Show current conversation history if any
  const historyLength = ollamaService.getHistoryLength();
  if (historyLength > 0) {
    console.log(`📝 Current conversation history: ${historyLength} messages`);
  }

  console.log('💬 Interactive mode - ask questions to test streaming responses');
  console.log('Type "quit" to exit\n');

  askQuestion();
}

// Handle command line arguments for quick testing
async function runFromCommandLine(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const query = args.join(' ');
    console.log('🔍 OllamaService Integration Test (Command Line Mode)');
    console.log('================================================\n');

    const ollamaService = new OllamaService();

    // Test connection
    console.log('Testing Ollama connection...');
    const isConnected = await ollamaService.testConnection();
    
    if (!isConnected) {
      console.error('❌ Ollama service is not available at http://localhost:11434');
      process.exit(1);
    }

    console.log('✅ Ollama service is available\n');
    console.log(`📤 Query: "${query}"`);
    console.log('🔄 Streaming response:\n');

    let responseStartTime = Date.now();
    let tokenCount = 0;

    try {
      await ollamaService.generateStreamingResponse(
        query,
        (chunk: string) => {
          process.stdout.write(chunk);
          tokenCount++;
        },
        (fullResponse: string) => {
          const responseTime = Date.now() - responseStartTime;
          console.log('\n');
          console.log('─'.repeat(50));
          console.log(`✅ Response complete!`);
          console.log(`📊 Stats:`);
          console.log(`   • Tokens: ${tokenCount}`);
          console.log(`   • Time: ${responseTime}ms`);
          console.log(`   • Tokens/sec: ${(tokenCount / (responseTime / 1000)).toFixed(2)}`);
          console.log(`   • Full response length: ${fullResponse.length} characters`);
          console.log('─'.repeat(50));
          process.exit(0);
        },
        (error: string) => {
          console.log('\n');
          console.error(`❌ Error: ${error}`);
          process.exit(1);
        }
      );
    } catch (error) {
      console.log('\n');
      console.error(`❌ Unexpected error: ${error}`);
      process.exit(1);
    }
  } else {
    await testOllamaIntegration();
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Goodbye!');
  process.exit(0);
});

if (require.main === module) {
  runFromCommandLine().catch((error) => {
    console.error('Failed to run integration test:', error);
    process.exit(1);
  });
}
