/**
 * HTTP effect for making network requests
 */
export type HTTPEffect = {
  /**
   * Fetch data from a URL
   */
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
};
