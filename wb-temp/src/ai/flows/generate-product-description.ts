
'use server';

/**
 * @fileOverview A Genkit flow for generating product descriptions.
 * This flow takes a product name and generates a compelling, SEO-friendly description.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
});

export type GenerateDescriptionInput = z.infer<typeof GenerateDescriptionInputSchema>;

const GenerateDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated product description.'),
});

export type GenerateDescriptionOutput = z.infer<typeof GenerateDescriptionOutputSchema>;

export async function generateProductDescription(
  input: GenerateDescriptionInput
): Promise<GenerateDescriptionOutput> {
  return generateDescriptionFlow(input);
}

const descriptionPrompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: { schema: GenerateDescriptionInputSchema },
  output: { schema: GenerateDescriptionOutputSchema },
  prompt: `You are an expert e-commerce copywriter specializing in organic and health food products for a brand called "Woody Business".

Your task is to write a compelling, SEO-friendly product description for the following product: "{{productName}}".

The description should:
- Be engaging and informative.
- Highlight the key benefits and unique selling points.
- Mention that it is grown organically.
- Keep the tone friendly, trustworthy, and natural.
- Be around 2-3 sentences long.
`,
});

const generateDescriptionFlow = ai.defineFlow(
  {
    name: 'generateDescriptionFlow',
    inputSchema: GenerateDescriptionInputSchema,
    outputSchema: GenerateDescriptionOutputSchema,
  },
  async (input: GenerateDescriptionInput) => {
    const { output } = await descriptionPrompt(input);
    return output!;
  }
);
