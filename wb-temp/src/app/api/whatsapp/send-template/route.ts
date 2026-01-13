import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp-cloud';

const requestSchema = z.object({
  to: z.string(),
  templateName: z.string().optional(),
  languageCode: z.string().optional(),
  bodyParameters: z.array(z.string()).optional(),
  headerParameters: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const data = requestSchema.parse(payload);

    const templateName =
      data.templateName ||
      process.env.WHATSAPP_TEMPLATE_NAME ||
      process.env.WHATSAPP_ORDER_TEMPLATE_NAME;
    const languageCode =
      data.languageCode ||
      process.env.WHATSAPP_TEMPLATE_LANGUAGE ||
      'en_US';

    if (!templateName) {
      return NextResponse.json(
        { error: 'WhatsApp template name is not configured' },
        { status: 400 }
      );
    }

    await sendWhatsAppTemplateMessage({
      to: data.to,
      templateName,
      languageCode,
      bodyParameters: data.bodyParameters || [],
      headerParameters: data.headerParameters || [],
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const message =
      error?.message ||
      (typeof error === 'string' ? error : 'Unknown error');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

