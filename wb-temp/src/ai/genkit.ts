
'use server';

export const ai: any = {
  definePrompt: (config: any) => {
    return async (input: any) => {
      if (config?.name === 'generateProductDescriptionPrompt' && input?.productName) {
        return {
          output: {
            description: `${input.productName} is crafted with care from organic materials. A thoughtful, natural choice perfect for gifting.`,
          },
        };
      }
      return { output: {} };
    };
  },
  defineFlow: (_opts: any, handler: any) => handler,
  defineTool: (_opts: any, handler: any) => ({ run: handler }),
  generate: async (_opts: any) => ({ toolCalls: [] }),
};
