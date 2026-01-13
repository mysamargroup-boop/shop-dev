# **App Name**: Milletraj

## Core Features:

- Product Catalog: Display a listing of available millet products with details like price, description, and image.
- Product Details: Show detailed information about a specific millet product, including nutrition facts, benefits, and purchase options.
- Wishlist: Allow users to save products to a wishlist using sessionStorage.
- WhatsApp Checkout: Enable users to initiate a purchase via WhatsApp with a pre-filled message containing order details in an attractive popup format after pressing the buy now button or proceeding from the cart page. The LLM will use a tool which parses data to fill required fields in the checkout message.
- Admin Product Management: Provide an admin interface, accessible via the /mr-admin route, to create, edit, and delete products, manage inventory, and upload images.
- User Authentication (Admin): Secure the admin panel with Firebase Authentication to ensure only authorized users can access product management features.
- Category Slider: Display product categories in a visually appealing horizontal slider.

## Style Guidelines:

- Primary color: Earthy green (#8FBC8F) to represent natural, healthy products.
- Background color: Light beige (#F5F5DC) for a clean, organic feel.
- Accent color: Warm brown (#A0522D) for highlights and calls to action.
- Font pairing: 'PT Sans' (sans-serif) for body text and 'Playfair Display' (serif) for headlines, for a blend of readability and elegance.
- Use clean, simple line icons related to food, health, and nature.
- Responsive grid layout for product listings, ensuring optimal viewing on all devices.
- Subtle transitions and animations to enhance user experience during product browsing and checkout.