import { ListIssues } from './list-issues.js';
import { GetIssue } from './get-issue.js';
import { ListMembers } from './list-members.js';
import { ListProjects } from './list-projects.js';
import { AddComment } from './add-comment.js';
import { CreateIssue } from './create-issue.js';
import { UpdateIssue } from './update-issue.js';
import { ListWorkflowStates } from './list-workflow-states.js';

// For backward compatibility
import { ListIssues as ListTickets } from './list-issues.js';
import { GetIssue as GetTicket } from './get-issue.js';

export const tools = [
  ListIssues,
  GetIssue,
  ListMembers,
  ListProjects,
  AddComment,
  CreateIssue,
  UpdateIssue,
  ListWorkflowStates,
  // We still export the ticket aliases but prefer using the new issue names
  ListTickets,
  GetTicket,
];
