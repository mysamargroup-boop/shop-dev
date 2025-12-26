
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST() {
  console.log('Starting WhatsApp checkout flow test via API route...');
  try {
    const productName = "Milk Cake";
    const productDescription = "A delicious sweet made from milk.";
    const originalPrice = 5000;
    const productPrice = 4800;
    const discountPercentage = 4;
    const shippingCost = 0;
    const totalCost = 4800;
    const quantity = 8;
    const customerName = "Rahul";
    const customerPhoneNumber = "919530343432";
    const customerAddress = "Near City Mall, Indore, MP - 452001";
    const extraNote = "Please deliver in the evening.";
    const productUrls = ["https://example.com/milk-cake.jpg"];

    // I will need you to provide the following information
    const WHATSAPP_ACCESS_TOKEN = 'YOUR_WHATSAPP_ACCESS_TOKEN';
    const PHONE_NUMBER_ID = 'YOUR_PHONE_NUMBER_ID';
    const TEMPLATE_NAME = 'YOUR_TEMPLATE_NAME';

    const whatsappApiUrl = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to: customerPhoneNumber,
      type: "template",
      template: {
        name: TEMPLATE_NAME,
        language: {
          code: "en_US"
        },
        components: [
          // This is an example of what the components might look like.
          // You will need to adjust this based on your actual template.
          {
            type: "body",
            parameters: [
              { type: "text", text: customerName },
              { type: "text", text: productName },
              { type: "text", text: quantity.toString() },
              { type: "text", text: totalCost.toString() },
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              {
                type: "text",
                text: "checkout"
              }
            ]
          }
        ]
      }
    };

    const headers = {
      'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(whatsappApiUrl, payload, { headers });

    console.log("Flow finished. Result:", response.data);
    return NextResponse.json(response.data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error running WhatsApp flow test:", errorMessage);
    if (axios.isAxiosError(error)) {
        console.error("Axios error details:", error.response?.data);
        return NextResponse.json({ error: errorMessage, details: error.response?.data }, { status: 500 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
