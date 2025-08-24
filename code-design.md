# Code Design Document: Suspect Text Display System

## System Overview

The suspect text display system ensures that AI responses only appear after the first word arrives, while keeping the user's previous message visible during the waiting period. This creates a natural conversation flow without empty text boxes.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Game Scene                           │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   Game State    │    │  Ollama Service │                │
│  │                 │    │                 │                │
│  │ • conversation  │    │ • streaming     │                │
│  │   history       │    │   response      │                │
│  │ • generating    │    │ • error         │                │
│  │   flag          │    │   handling      │                │
│  └─────────────────┘    └─────────────────┘                │
│           │                       │                        │
│           └───────────┬───────────┘                        │
│                       │                                    │
│              ┌─────────────────┐                           │
│              │ Conversation    │                           │
│              │ Display         │                           │
│              │                 │                           │
│              │ • UI rendering  │                           │
│              │ • text streaming│                           │
│              │ • input handling│                           │
│              └─────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### GameScene
**Role**: Main controller and conversation orchestrator
- Manages conversation flow and turn-taking
- Coordinates between UI and AI service
- Handles user input processing
- Maintains conversation history

**Key Methods**:
- `handlePlayerInput()` - Processes user responses
- `getAIResponse()` - Initiates AI streaming
- `addToConversation()` - Adds completed messages

### ConversationDisplay
**Role**: UI manager and text renderer
- Renders conversation messages
- Manages streaming text appearance
- Handles input field visibility
- Controls visual animations

**Key Methods**:
- `addEntry()` - Displays new conversation entries
- `updateStreamingText()` - Handles real-time text updates
- `completeStreaming()` - Finalizes streaming responses
- `showInput()/hideInput()` - Manages user input

### OllamaService
**Role**: AI communication handler
- Manages streaming responses from AI
- Handles network errors and timeouts
- Provides fallback responses

**Key Methods**:
- `generateStreamingResponse()` - Streams AI responses with callbacks

### ConversationEntry
**Role**: Data structure for messages
- Defines message format and metadata
- Contains streaming state flag

## State Flow Diagram

```
┌─────────────────┐
│   Game Start    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Show Initial    │
│ Suspect Message │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐    User Types    ┌─────────────────┐
│ Wait for User   │ ────────────────▶ │ Process User    │
│ Input           │                   │ Input           │
└─────────────────┘                   └─────────┬───────┘
          ▲                                     │
          │                                     ▼
          │                           ┌─────────────────┐
          │                           │ Show User Text  │
          │                           │ + Suspect Name  │
          │                           └─────────┬───────┘
          │                                     │
          │                                     ▼
          │                           ┌─────────────────┐
          │                           │ Start AI        │
          │                           │ Streaming       │
          │                           └─────────┬───────┘
          │                                     │
          │                                     ▼
          │                           ┌─────────────────┐
          │                           │ First Word      │
          │                           │ Arrives         │
          │                           └─────────┬───────┘
          │                                     │
          │                                     ▼
          │                           ┌─────────────────┐
          │                           │ Show Streaming  │
          │                           │ Text + Cursor   │
          │                           └─────────┬───────┘
          │                                     │
          │                                     ▼
          │                           ┌─────────────────┐
          │                           │ Complete        │
          │                           │ Response        │
          │                           └─────────┬───────┘
          │                                     │
          └─────────────────────────────────────┘
```

## Visual State Transitions

### State 1: User Message Visible
```
┌─────────────────────────────────────┐
│ Detective Smith                     │
│ "What were you doing last night?"   │
│                               ◆     │
└─────────────────────────────────────┘
```

### State 2: Waiting for AI (Key Innovation)
```
┌─────────────────────────────────────┐
│ Detective Smith                     │
│ "What were you doing last night?"   │
│                               ◆     │
└─────────────────────────────────────┘
```

### State 3: AI Response Streaming
```
┌─────────────────────────────────────┐
│ Suspect                             │
│ "I was at home watching TV w"        │
└─────────────────────────────────────┘
```

### State 4: Response Complete
```
┌─────────────────────────────────────┐
│ Suspect                             │
│ "I was at home watching TV with my  │
│ roommate until around midnight."    │
│                               ◆     │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ [Enter your response]         │
└─────────────────────────────────────┘
```

## Key Design Decisions

### 1. Streaming Entry Flag
- **Decision**: Use `isStreaming` boolean flag in ConversationEntry
- **Rationale**: Simple flag controls rendering behavior
- **Impact**: Clean separation between streaming and static messages

### 2. Delayed Suspect Turn
- **Decision**: Create message text only when first chunk arrives
- **Rationale**: Prevents empty text boxes during waiting
- **Impact**: User sees their own text while waiting


## Error Handling Strategy

### Network Errors
open popup with error and option to retry

### Timeout Handling
open popup with error and option to retry

## Performance Considerations


## File Structure

```
src/
├── scenes/
│   └── GameScene.ts          # Main controller
├── objects/
│   └── ConversationDisplay.ts # UI manager
├── services/
│   └── OllamaService.ts      # AI communication
└── types/
    └── DialogTypes.ts        # Data structures
```
