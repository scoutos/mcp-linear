/**
 * Linear API types
 */

/**
 * Linear issue
 */
export type Issue = {
  id: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: number;
  labels?: Label[];
  assignee?: User;
  team?: Team;
  comments?: Comment[];
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Linear comment
 */
export type Comment = {
  id: string;
  body: string;
  user?: User;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Linear user
 */
export type User = {
  id: string;
  name: string;
  email?: string;
};

/**
 * Linear team
 */
export type Team = {
  id: string;
  name: string;
  key: string;
};

/**
 * Linear label
 */
export type Label = {
  id: string;
  name: string;
  color?: string;
};

/**
 * Linear search results
 */
export type SearchResults = {
  results: Issue[];
};

/**
 * Linear issue update request
 */
export type IssueUpdateRequest = {
  title?: string;
  description?: string;
  status?: string;
  priority?: number;
  assigneeId?: string;
  labelIds?: string[];
};

/**
 * Linear comment creation request
 */
export type CommentCreateRequest = {
  body: string;
};
