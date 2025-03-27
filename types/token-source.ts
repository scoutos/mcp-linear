/**
 * Token source interface
 */
export type TokenSource = {
  /**
   * Get a valid token for authentication
   */
  getToken: () => Promise<string>;

  /**
   * Refresh the token if needed
   */
  refreshToken?: () => Promise<string>;
};