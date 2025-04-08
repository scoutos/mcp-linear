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
    },
  ];

  const mockIssues = {
    nodes: options.issues?.nodes || defaultNodes,
  };

  return {
    // Track calls for assertion in tests
    _calls: {
      issues: [],
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
        // Check our mock data - since we know the structure, we can filter directly
        nodesToReturn = nodesToReturn.filter(node => {
          // In a real implementation, this would be handled by the Linear API
          return node.state.then(state => state.name === stateName);
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
  };
}
