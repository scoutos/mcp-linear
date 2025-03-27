# Actions and Effects Architecture

## Philosophy

Our architecture follows a functional approach to the hexagonal architecture pattern, focusing on simplicity and clarity while maintaining strong separation of concerns. This approach moves away from traditional object-oriented concepts like interfaces and abstract classes in favor of simpler TypeScript types and pure functions.

We still heavily rely on dependency injection, but implement it through function parameters rather than class constructors. This maintains the benefits of dependency injection (testability, interoperability between providers, clear dependency relationships) while simplifying the implementation.

## Key Concepts

### Effects

Effects represent all side-effects and external interactions in our application:

- Defined as TypeScript types (not interfaces/abstract classes)
- Represent capabilities for interacting with the outside world
- Named with the suffix "Effect" (e.g., `BlobStorageEffect`)
- Organized in an `/effects` directory, categorized by domain

Example:

```typescript
// effects/blob-storage/index.ts
export type BlobStorageEffect = {
  saveBlob: (key: string, data: Uint8Array) => Promise<void>;
  getBlob: (key: string) => Promise<Uint8Array | null>;
  deleteBlob: (key: string) => Promise<void>;
};
```

### Effect Implementations

Each effect can have multiple implementations:

- Concrete implementations are exported as objects/functions
- Named descriptively without "Adapter" or "Implementation" suffixes
- Focus on a specific technology or environment
- Located alongside their effect definitions or in subdirectories

Example:

```typescript
// effects/blob-storage/cloud-provider.ts
export const cloudBlobStorage: BlobStorageEffect = {
  async saveBlob(key, data) {
    // Cloud-specific implementation
  },
  async getBlob(key) {
    // Cloud-specific implementation
  },
  async deleteBlob(key) {
    // Cloud-specific implementation
  },
};
```

### Actions

Actions contain the core business logic of the application:

- Pure functional logic that uses effects for side effects
- Structured as factory functions that accept required effects
- Return an object with an `execute` method (or other domain-specific methods)
- Focus on domain language, not technical implementation
- Specify their effect dependencies explicitly

Example:

```typescript
// actions/get-chat-history.ts
import { BlobStorageEffect } from "../effects/blob-storage";

type GetChatHistoryEffects = {
  blobStorage: BlobStorageEffect;
};

export const GetChatHistoryAction = (effects: GetChatHistoryEffects) => ({
  async execute(chatId: string): Promise<string[]> {
    const blobKey = `chat-history-${chatId}`;
    const blobData = await effects.blobStorage.getBlob(blobKey);

    if (!blobData) {
      return []; // Return empty history if no data is found
    }

    const history = new TextDecoder().decode(blobData);
    return JSON.parse(history) as string[];
  },
});
```

## Dependency Injection

Our architecture emphasizes dependency injection through function parameters:

```typescript
// Explicitly declare all dependencies as a parameter object
export const GetChatHistoryAction = (effects: GetChatHistoryEffects) => {
  // Return actions that use the injected effects
  return {
    async execute(chatId: string): Promise<string[]> {
      // Implementation uses injected effects
    },
  };
};
```

Key benefits:

- **Explicit dependencies**: All required effects are clearly defined in the parameter type
- **Testability**: Easy to substitute real implementations with mocks during testing
- **Flexibility**: Switch between different providers (e.g., cloud vs. local storage)
- **Configuration**: Centralize effect implementation selection at the composition root

## Usage Pattern

1. Define effects that represent external capabilities
2. Create implementations for those effects for specific technologies
3. Write actions that depend on effects and contain business logic
4. Compose actions with specific effect implementations at the application boundary

Example composition:

```typescript
// app.ts (composition root)
import { cloudBlobStorage } from "./effects/blob-storage/cloud-provider";
import { GetChatHistoryAction } from "./actions/get-chat-history";

// Compose action with specific effect implementation (dependency injection)
const getChatHistory = GetChatHistoryAction({
  blobStorage: cloudBlobStorage,
});

// Use the action
const history = await getChatHistory.execute("chat-123");
```

## Testing

This approach simplifies testing by making it easy to provide test implementations:

```typescript
// test-utils/in-memory-blob-storage.ts
import { BlobStorageEffect } from "../effects/blob-storage";

export function createInMemoryBlobStorage(): BlobStorageEffect {
  const blobs = new Map<string, Uint8Array>();

  return {
    async saveBlob(key, data) {
      blobs.set(key, data);
    },
    async getBlob(key) {
      return blobs.get(key) || null;
    },
    async deleteBlob(key) {
      blobs.delete(key);
    },
  };
}

// in tests:
const testBlobStorage = createInMemoryBlobStorage();
const getChatHistory = GetChatHistoryAction({ blobStorage: testBlobStorage });
// Test getChatHistory.execute()...
```

## Benefits Over Traditional Ports and Adapters

- **Less boilerplate**: No interfaces, abstract classes, or inheritance
- **Simpler mental model**: Just functions and data
- **Better TypeScript experience**: Types instead of interfaces
- **More testable**: Pure functions with explicit dependencies
- **More flexible**: Easier to compose and reuse
- **Clearer boundaries**: Effects explicitly separate core logic from external concerns
- **Maintained dependency injection**: Preserves the benefits of DI but with simpler function parameters
- **Centralized composition**: Clear composition root for wiring up dependencies
- **Improved provider interoperability**: Easily switch between different cloud/service providers
