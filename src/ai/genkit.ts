
'use server';

/**
 * @fileoverview This file initializes the Genkit AI instance and configures the plugins.
 * It exports a single `ai` object that should be used for all AI-related operations.
 */

import { genkit, type Genkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/google-genai';

// This is the global AI instance.
// All flows, prompts, and tools should be defined using this instance.
export const ai: Genkit = genkit({
  plugins: [
    googleAI({
      apiVersion: 'v1beta',
    }),
  ],
});
