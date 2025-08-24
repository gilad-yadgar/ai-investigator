// Setup file for Jest tests
import 'jest-environment-jsdom';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock ReadableStream and TextDecoder for streaming tests
global.ReadableStream = class MockReadableStream {
  constructor(underlyingSource?: any) {
    this.locked = false;
    this._reader = new MockReadableStreamDefaultReader(underlyingSource);
  }
  
  locked: boolean;
  _reader: any;

  getReader() {
    this.locked = true;
    return this._reader;
  }

  cancel() {
    return Promise.resolve();
  }
} as any;

class MockReadableStreamDefaultReader {
  private chunks: string[];
  private currentIndex: number;
  private closed: boolean;

  constructor(underlyingSource?: any) {
    this.chunks = underlyingSource?.chunks || [];
    this.currentIndex = 0;
    this.closed = false;
  }

  read(): Promise<{ done: boolean; value?: Uint8Array }> {
    if (this.closed || this.currentIndex >= this.chunks.length) {
      return Promise.resolve({ done: true });
    }

    const chunk = this.chunks[this.currentIndex];
    this.currentIndex++;
    
    const encoder = new TextEncoder();
    return Promise.resolve({
      done: false,
      value: encoder.encode(chunk)
    });
  }

  releaseLock() {
    // Mock implementation
  }
}

// Mock TextDecoder and TextEncoder if not available
if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = class MockTextDecoder {
    decode(input?: BufferSource, options?: { stream?: boolean }): string {
      if (!input) return '';
      // Simple mock implementation for testing
      const uint8Array = new Uint8Array(input as ArrayBuffer);
      let result = '';
      for (let i = 0; i < uint8Array.length; i++) {
        result += String.fromCharCode(uint8Array[i]);
      }
      return result;
    }
  } as any;
}

if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = class MockTextEncoder {
    encode(input: string): Uint8Array {
      const result = new Uint8Array(input.length);
      for (let i = 0; i < input.length; i++) {
        result[i] = input.charCodeAt(i);
      }
      return result;
    }
  } as any;
}

beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
});
