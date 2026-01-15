import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

type Payload = {
  to: string;
  templateName?: string;
  languageCode?: string;
  bodyParameters?: string[];
  headerParameters?: string[];
};

type SendResult = {
  success: boolean;
};

function getEnv(name: string): string | undefined {
  const value = Deno.env.get(name);
  return value && value.length > 0 ? value : undefined;
}

async function sendWhatsAppTemplateMessageEdge(input: {
  to: string;
  templateName: string;
  languageCode: string;
  bodyParameters?: string[];
  headerParameters?: string[];
}): Promise<SendResult> {
  const accessToken =
    getEnv('WHATSAPP_CLOUD_ACCESS_TOKEN') || getEnv('WHATSAPP_ACCESS_TOKEN');
  const phoneNumberId =
    getEnv('WHATSAPP_CLOUD_PHONE_NUMBER_ID') ||
    getEnv('WHATSAPP_PHONE_NUMBER_ID');
  const apiVersion = getEnv('WHATSAPP_API_VERSION') || 'v20.0';

  if (!accessToken) {
    throw new Error(
      'WHATSAPP_CLOUD_ACCESS_TOKEN or WHATSAPP_ACCESS_TOKEN is not set',
    );
  }
  if (!phoneNumberId) {
    throw new Error(
      'WHATSAPP_CLOUD_PHONE_NUMBER_ID or WHATSAPP_PHONE_NUMBER_ID is not set',
    );
  }

  const normalizedLanguage =
    input.languageCode === 'en' ? 'en_US' : input.languageCode;

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const components: Array<{
    type: 'header' | 'body';
    parameters: Array<{ type: 'text'; text: string }>;
  }> = [];

  if (input.headerParameters && input.headerParameters.length > 0) {
    components.push({
      type: 'header',
      parameters: input.headerParameters.map((text) => ({ type: 'text', text })),
    });
  }

  if (input.bodyParameters && input.bodyParameters.length > 0) {
    components.push({
      type: 'body',
      parameters: input.bodyParameters.map((text) => ({ type: 'text', text })),
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: input.to,
      type: 'template',
      template: {
        name: input.templateName,
        language: { code: normalizedLanguage },
        ...(components.length > 0 ? { components } : {}),
      },
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data &&
        (data.error?.message || data.error?.error_user_msg || data.message)) ||
      response.statusText ||
      'WhatsApp API request failed';
    throw new Error(`WhatsApp API error (${response.status}): ${message}`);
  }

  return { success: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, apikey, x-client-info',
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    const payload = (await req.json()) as Payload;

    if (!payload || typeof payload.to !== 'string' || !payload.to.trim()) {
      return new Response(
        JSON.stringify({ error: 'Field "to" is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    const templateName =
      payload.templateName ||
      getEnv('WHATSAPP_TEMPLATE_NAME') ||
      getEnv('WHATSAPP_ORDER_TEMPLATE_NAME');
    const languageCode =
      payload.languageCode ||
      getEnv('WHATSAPP_TEMPLATE_LANGUAGE') ||
      'en_US';

    if (!templateName) {
      return new Response(
        JSON.stringify({
          error: 'WhatsApp template name is not configured',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    await sendWhatsAppTemplateMessageEdge({
      to: payload.to,
      templateName,
      languageCode,
      bodyParameters: payload.bodyParameters || [],
      headerParameters: payload.headerParameters || [],
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as any).message)
        : 'Unknown error';

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
