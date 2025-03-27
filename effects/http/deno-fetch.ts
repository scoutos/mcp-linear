import { HTTPEffect } from "./index.ts";

/**
 * Implementation of HTTPEffect using Deno's native fetch
 */
export const denoFetch: HTTPEffect = {
  async fetch(url, options) {
    return await fetch(url, options);
  },
};