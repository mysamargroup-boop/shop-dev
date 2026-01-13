
'use server';

import { z } from 'zod';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp-cloud';

const WhatsAppCheckoutInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  sku: z.string().optional().describe('The SKU/ID of the product.'),
  productDescription: z.string().describe('A brief description of the product.'),
  originalPrice: z.number().describe('The original price of the product before discounts.'),
  productPrice: z.number().describe('The price of the product after discount.'),
  discountPercentage: z.number().optional().describe('The discount percentage applied.'),
  shippingCost: z.number().describe('The cost of shipping.'),
  totalCost: z.number().describe('The total cost of the order including shipping.'),
  quantity: z.number().describe('The quantity of the product being purchased.'),
  customerName: z.string().describe('The name of the customer.'),
  customerPhoneNumber: z.string().describe('The customer phone number to prefill whatsapp.'),
  customerAddress: z.string().describe('The delivery address of the customer.'),
  extraNote: z.string().optional().describe('An optional note from the customer.'),
  productUrls: z.array(z.string()).optional().describe('The URLs of the products being purchased.'),
});

export type WhatsAppCheckoutInput = z.infer<typeof WhatsAppCheckoutInputSchema>;

const WhatsAppCheckoutOutputSchema = z.object({
  message: z.string().describe('The generated order confirmation message.'),
});

export type WhatsAppCheckoutOutput = z.infer<typeof WhatsAppCheckoutOutputSchema>;

export async function generateWhatsAppCheckoutMessage(input: WhatsAppCheckoutInput): Promise<WhatsAppCheckoutOutput> {
  const orderIdPrefix = process.env.WHATSAPP_ORDER_ID_PREFIX || 'BULK-';
  const orderId = `${orderIdPrefix}${Math.floor(Math.random() * 100000)}`;
  const productLineItem = `${input.productName} – ${input.quantity}`;

  const templateName = process.env.WHATSAPP_ORDER_TEMPLATE_NAME || 'confirm_buisness_web';
  const templateLanguage = process.env.WHATSAPP_ORDER_TEMPLATE_LANGUAGE || 'en';

  const templateValues: Record<string, string> = {
    customerName: input.customerName,
    orderId: orderId,
    productName: input.productName,
    productLineItem: productLineItem,
    customerAddress: input.customerAddress,
    totalCost: String(input.totalCost),
    quantity: String(input.quantity),
  };

  const bodyKeys = (process.env.WHATSAPP_ORDER_TEMPLATE_BODY_KEYS || 'customerName,orderId,productName,productLineItem,customerAddress,totalCost')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);

  const headerKeys = (process.env.WHATSAPP_ORDER_TEMPLATE_HEADER_KEYS || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);

  const bodyParameters = bodyKeys.map(key => templateValues[key] || '');
  const headerParameters = headerKeys.map(key => templateValues[key] || '');

  try {
    await sendWhatsAppTemplateMessage({
      to: input.customerPhoneNumber,
      templateName: templateName,
      languageCode: templateLanguage,
      headerParameters: headerParameters,
      bodyParameters: bodyParameters,
    });
    return { message: 'WhatsApp message sent successfully.' };
  } catch (e) {
    console.error('Failed to send WhatsApp order confirmation:', e);
    throw new Error('Failed to send WhatsApp message.');
  }
}
