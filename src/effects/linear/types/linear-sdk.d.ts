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
    
    // Team retrieval method
    team(teamId: string): Promise<Team>;
  }
  
  interface Issue {
    // Update method for issues
    update(data: {
      title?: string;
      description?: string;
      stateId?: string;
      priority?: number;
      assigneeId?: string | null;
      [key: string]: any;
    }): Promise<any>;
  }
  
  interface Team {
    // Get workflow states method
    states(): Promise<{ nodes: any[] }>;
    
    // Team name
    name: string;
  }
}
// This ensures the TypeScript types are available in JavaScript files