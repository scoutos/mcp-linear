/**
 * Type declarations for better intellisense with the Linear SDK
 * This file provides improved IDE support when working with the SDK
 */

// Import and re-export the types from the Linear SDK
import '@linear/sdk';

// Extend the LinearClient interface to include the methods we need
declare module '@linear/sdk' {
  interface LinearClient {
    // Issue creation method
    issueCreate(issueInput: {
      title: string;
      teamId: string;
      description?: string;
      priority?: number;
      assigneeId?: string;
      stateId?: string;
      projectId?: string;
      [key: string]: any;
    }): Promise<{ issue: Promise<any> }>;
  }
}
// This ensures the TypeScript types are available in JavaScript files