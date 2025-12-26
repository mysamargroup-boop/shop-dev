
'use server';

/**
 * @fileOverview This file defines a Genkit flow for handling new user subscriptions.
 * It takes subscriber details, sends a notification to the business owner,
 * and includes a placeholder for Google Sheets integration.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp-cloud';

const SubscriptionInputSchema = z.object({
  customerName: z.string().describe('The name of the subscriber.'),
  customerPhoneNumber: z.string().describe('The WhatsApp number of the subscriber.'),
});

export type SubscriptionInput = z.infer<typeof SubscriptionInputSchema>;

const SubscriptionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type SubscriptionOutput = z.infer<typeof SubscriptionOutputSchema>;

// This is a placeholder function. You would need to implement the logic
// to interact with the Google Sheets API.
async function addToGoogleSheet(data: SubscriptionInput): Promise<{ success: boolean }> {
  console.log('--- Adding to Google Sheet (Placeholder) ---');
  console.log('Name:', data.customerName);
  console.log('WhatsApp:', data.customerPhoneNumber);
  console.log('------------------------------------------');
  // In a real implementation:
  // 1. Authenticate with Google Sheets API.
  // 2. Append a new row with the data.
  // 3. Return { success: true } or { success: false } based on the result.
  return { success: true };
}


const notifyOwnerTool = ai.defineTool(
  {
    name: 'notifyOwnerViaWhatsApp',
    description: 'Sends a WhatsApp notification to the business owner about a new subscriber.',
    inputSchema: z.object({
      message: z.string().describe('The notification message to send.'),
    }),
    outputSchema: z.object({ success: z.boolean() }),
  },
  async ({ message }) => {
    const ownerWhatsAppNumber = process.env.OWNER_WHATSAPP_NUMBER || '919691045405';
    // This would use a real WhatsApp API in production
    console.log(`--- Sending WhatsApp to Owner (${ownerWhatsAppNumber}) ---`);
    console.log(message);
    console.log('---------------------------------------------');
    try {
      await sendWhatsAppTextMessage({ to: ownerWhatsAppNumber, body: message });
      return { success: true };
    } catch (error) {
      console.error('Failed to send WhatsApp message to owner:', error);
      return { success: false };
    }
  }
);


const subscriptionFlow = ai.defineFlow(
  {
    name: 'handleSubscriptionFlow',
    inputSchema: SubscriptionInputSchema,
    outputSchema: SubscriptionOutputSchema,
  },
  async (input) => {
    
    const [sheetResult, llmResult] = await Promise.all([
        addToGoogleSheet(input),
        ai.generate({
            prompt: `A new user named "${input.customerName}" has subscribed with the WhatsApp number ${input.customerPhoneNumber}. Draft a notification message for the business owner.`,
            tools: [notifyOwnerTool],
        })
    ]);

    const toolCalls = llmResult.toolCalls;
    if (toolCalls.length > 0) {
        await Promise.all(toolCalls.map(async (toolCall) => {
            const toolResult = await toolCall.run();
            console.log('Tool call result:', toolResult);
        }));
    }

    if (!sheetResult.success) {
      return { success: false, message: "Failed to add subscriber to the sheet." };
    }

    return { success: true, message: "Subscription processed successfully." };
  }
);


export async function handleSubscription(input: SubscriptionInput): Promise<SubscriptionOutput> {
  return subscriptionFlow(input);
}
