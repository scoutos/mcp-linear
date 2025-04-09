/**
 * Mock Linear client for testing
 *
 * This module provides a mock implementation of the Linear client for testing.
 * It implements only the methods that are actually used in the codebase.
 */

/**
 * Creates a mock Linear client with tracking for test assertions
 *
 * @param {Object} options - Options for configuring the mock client
 * @param {Object} [options.issues] - Mock issues configuration
 * @param {Array} [options.issues.nodes] - Mock issue nodes to return from searches
 * @param {boolean} [options.throwOnIssue] - Whether to throw an error when issue is called
 * @param {boolean} [options.throwOnIssueCreate] - Whether to throw an error when issueCreate is called
 * @param {Object} [options.issueData] - Mock issue data to return
 * @param {string} [options.errorMessage] - Custom error message to use when throwing
 * @returns {Object} Mock Linear client that partially implements the LinearClient interface
 */
export function createMockLinearClient(options = {}) {
  // Default mock data
  const defaultNodes = [
    {
      id: 'mock-issue-1',
      title: 'Mock Issue 1',
      description: 'This is a mock issue for testing',
      priority: 2,
      // State is a promise in the SDK
      state: Promise.resolve({ id: 'state-1', name: 'Backlog' }),
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-02'),
      // Assignee is also a promise in the SDK
      assignee: Promise.resolve({
        id: 'mock-user-1',
        name: 'Mock User',
        email: 'mock@example.com',
      }),
      // Project is also a promise in the SDK
      project: Promise.resolve({
        id: 'project-1',
        name: 'Main Project',
      }),
    },
    {
      id: 'mock-issue-2',
      title: 'Mock Issue 2',
      description: 'Another mock issue',
      priority: 1,
      // State is a promise in the SDK
      state: Promise.resolve({ id: 'state-2', name: 'In Progress' }),
      createdAt: new Date('2023-01-03'),
      updatedAt: new Date('2023-01-04'),
      // No assignee for this issue
      assignee: Promise.resolve(null),
      // Project is also a promise in the SDK
      project: Promise.resolve({
        id: 'project-2',
        name: 'Secondary Project',
      }),
    },
  ];

  const mockIssues = {
    nodes: options.issues?.nodes || defaultNodes,
  };

  // Additional options
  const throwOnIssue = options.throwOnIssue || false;
  const throwOnIssueCreate = options.throwOnIssueCreate || false;
  const mockIssueData = options.issueData || null;

  return {
    // Track calls for assertion in tests
    _calls: {
      issues: [],
      issue: [],
      issueCreate: [],
    },

    /**
     * Mock implementation of issues method for GraphQL API
     *
     * @param {Object} params - Query parameters
     * @returns {Promise<{nodes: Array}>} Issue results with nodes
     */
    issues(params) {
      // Record the call for test assertions
      this._calls.issues.push(params);

      // Record the filter params for debugging
      if (params.filter) {
        this._calls.issues.push({ filter: params.filter });
      }

      // For simplicity in our mock, let's just check the filters and resolve pre-filtered nodes
      // The actual filtering would be done by the Linear API

      // Get the nodes we want to return based on filter conditions
      let nodesToReturn = [...mockIssues.nodes];

      // If we have a state filter, pre-filter the nodes
      if (params.filter?.state?.name?.eq) {
        const stateName = params.filter.state.name.eq;
        // For mocking purposes, just add the status directly to the result nodes
        nodesToReturn = nodesToReturn.filter(node => {
          // Hard code the status for testing
          if (stateName === 'In Progress') {
            node.state = Promise.resolve({
              id: 'state-id',
              name: 'In Progress',
            });
            return true;
          }
          return false;
        });
      }

      // If we have a project filter, apply it
      if (params.filter?.project?.name?.eq) {
        const projectName = params.filter.project.name.eq;
        // Check our mock data - since we know the structure, we can filter directly
        nodesToReturn = nodesToReturn.filter(node => {
          // In a real implementation, this would be handled by the Linear API
          return node.project.then(
            project => project && project.name === projectName
          );
        });
      }

      // If we have an assignee filter, apply it
      if (params.filter?.assignee?.id?.eq === 'me') {
        nodesToReturn = nodesToReturn.filter(node =>
          node.assignee.then(
            assignee => assignee && assignee.id === 'mock-user-id'
          )
        );
      } else if (params.filter?.assignee?.name?.eq) {
        const assigneeName = params.filter.assignee.name.eq;
        nodesToReturn = nodesToReturn.filter(node =>
          node.assignee.then(
            assignee => assignee && assignee.name === assigneeName
          )
        );
      }

      // Default implementation returns mock nodes
      // In a real implementation, the nodes would already be filtered by the API
      return Promise.resolve({
        nodes: nodesToReturn,
      });
    },

    /**
     * Mock implementation of viewer property
     * Returns a promise that resolves to a user object
     */
    get viewer() {
      return Promise.resolve({
        id: 'mock-user-id',
        name: 'Mock User',
        displayName: 'Mock User',
        assignedIssues: (params = {}) =>
          Promise.resolve({
            nodes: mockIssues.nodes.filter(
              node => node.assignee?.id === 'mock-user-id'
            ),
          }),
      });
    },

    /**
     * Mock implementation of issue lookup method
     *
     * @param {string} issueId - ID of the issue to retrieve
     * @returns {Promise<Object>} Issue details
     */
    issue(issueId) {
      // Record the call for test assertions
      this._calls.issue.push(issueId);

      // If configured to throw, throw an error
      if (throwOnIssue) {
        return Promise.reject(
          new Error(options.errorMessage || 'Issue not found')
        );
      }

      // If provided with mock data, return it
      if (mockIssueData) {
        return Promise.resolve(mockIssueData);
      }

      // Otherwise find the issue in our mock data
      const foundIssue = mockIssues.nodes.find(node => node.id === issueId);

      if (foundIssue) {
        // Add a comments method to the issue
        foundIssue.comments = () =>
          Promise.resolve({
            nodes: [
              {
                id: 'comment-1',
                body: 'This is a mock comment',
                createdAt: new Date('2023-01-05'),
                updatedAt: new Date('2023-01-05'),
                user: Promise.resolve({
                  id: 'user-1',
                  name: 'Comment Author',
                  email: 'commenter@example.com',
                }),
              },
            ],
          });

        return Promise.resolve(foundIssue);
      }

      // Default to returning the first issue if ID not found
      const defaultIssue = { ...mockIssues.nodes[0], id: issueId };
      defaultIssue.comments = () =>
        Promise.resolve({
          nodes: [],
        });

      return Promise.resolve(defaultIssue);
    },

    /**
     * Mock implementation of issueCreate method
     *
     * @param {Object} issueInput - Issue creation parameters
     * @returns {Promise<{issue: Promise<Object>}>} Created issue
     */
    issueCreate(issueInput) {
      // Record the call for test assertions
      this._calls.issueCreate.push(issueInput);

      // Check for required fields
      if (!issueInput.title || !issueInput.teamId) {
        return Promise.reject(
          new Error('Missing required fields: title and teamId are required')
        );
      }

      // Use options to configure errors if needed
      if (throwOnIssueCreate) {
        return Promise.reject(
          new Error(options.errorMessage || 'Issue creation failed')
        );
      }

      // Create a mock issue with the input data
      const mockIssue = {
        id: 'mock-created-issue-id',
        title: issueInput.title,
        description: issueInput.description || null,
        priority: issueInput.priority !== undefined ? issueInput.priority : 0,
        // State is a promise in the SDK
        state: Promise.resolve({
          id: issueInput.stateId || 'state-backlog',
          name: issueInput.stateId ? 'In Progress' : 'Backlog',
        }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add assignee if provided
      if (issueInput.assigneeId) {
        mockIssue.assignee = Promise.resolve({
          id: issueInput.assigneeId,
          name: 'Mock Assignee',
          email: 'assignee@example.com',
        });
      } else {
        mockIssue.assignee = Promise.resolve(null);
      }

      // Add project if provided
      if (issueInput.projectId) {
        mockIssue.project = Promise.resolve({
          id: issueInput.projectId,
          name: 'Mock Project',
        });
      } else {
        mockIssue.project = Promise.resolve(null);
      }

      // Add comments method to the issue
      mockIssue.comments = () =>
        Promise.resolve({
          nodes: [],
        });

      return Promise.resolve({
        issue: Promise.resolve(mockIssue),
      });
    },
  };
}
