export type SendWhatsAppTextMessageParams = {
  to: string;
  body: string;
  previewUrl?: boolean;
  accessToken?: string;
  phoneNumberId?: string;
  apiVersion?: string;
};

export type SendWhatsAppTemplateMessageParams = {
  to: string;
  templateName: string;
  languageCode: string;
  bodyParameters?: string[];
  headerParameters?: string[];
  accessToken?: string;
  phoneNumberId?: string;
  apiVersion?: string;
};

export async function sendWhatsAppTextMessage({
  to,
  body,
  previewUrl = false,
  accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID,
  apiVersion = 'v20.0',
}: SendWhatsAppTextMessageParams) {
  if (!accessToken) {
    throw new Error('WHATSAPP_CLOUD_ACCESS_TOKEN (or WHATSAPP_ACCESS_TOKEN) is not set');
  }
  if (!phoneNumberId) {
    throw new Error('WHATSAPP_CLOUD_PHONE_NUMBER_ID (or WHATSAPP_PHONE_NUMBER_ID) is not set');
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body,
        preview_url: previewUrl,
      },
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && (data.error?.message || data.error?.error_user_msg)) ||
      response.statusText ||
      'WhatsApp API request failed';
    throw new Error(`WhatsApp API error (${response.status}): ${message}`);
  }

  return data;
}

export async function sendWhatsAppTemplateMessage({
  to,
  templateName,
  languageCode,
  bodyParameters = [],
  headerParameters = [],
  accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID,
  apiVersion = 'v20.0',
}: SendWhatsAppTemplateMessageParams) {
  if (!templateName) {
    throw new Error('templateName is required');
  }
  if (!languageCode) {
    throw new Error('languageCode is required');
  }
  const normalizedLanguage =
    languageCode === 'en' ? 'en_US' : languageCode;
  if (!accessToken) {
    throw new Error('WHATSAPP_CLOUD_ACCESS_TOKEN (or WHATSAPP_ACCESS_TOKEN) is not set');
  }
  if (!phoneNumberId) {
    throw new Error('WHATSAPP_CLOUD_PHONE_NUMBER_ID (or WHATSAPP_PHONE_NUMBER_ID) is not set');
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const components: Array<{ type: 'header' | 'body'; parameters: Array<{ type: 'text'; text: string }> }> = [];

  if (headerParameters.length > 0) {
    components.push({
      type: 'header',
      parameters: headerParameters.map(text => ({ type: 'text', text })),
    });
  }

  if (bodyParameters.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParameters.map(text => ({ type: 'text', text })),
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
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: normalizedLanguage },
        ...(components.length > 0 ? { components } : {}),
      },
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && (data.error?.message || data.error?.error_user_msg)) ||
      response.statusText ||
      'WhatsApp API request failed';
    throw new Error(`WhatsApp API error (${response.status}): ${message}`);
  }

  return data;
}
