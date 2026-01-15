# Woody Business E-commerce Platform

A modern, scalable e-commerce platform built with Next.js 15, React 19, and Supabase for selling wooden products like keychains, wall hangings, and personalized gifts.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI, Lucide Icons
- **Backend**: Supabase Edge Functions (15 functions)
- **Database**: Supabase PostgreSQL
- **Payments**: Cashfree PG Integration
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage + Upstash Redis
- **Deployment**: Vercel (Production), VPS (Scaling option)

## Features

- Complete e-commerce functionality
- Payment gateway integration
- Responsive design with dark mode
- Admin panel for order management
- Analytics and reporting
- Shiprocket integration for shipping
- Email notifications (Mailgun)
- WhatsApp integration
- Invoice PDF generation
- Personalized product recommendations

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/mysamargroup-boop/woody-business.git
   cd woody-business
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Add your environment variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Upstash Redis Configuration
   UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-redis-token
   ```

4. **Database Setup**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Run the migration script: `supabase/migrations/complete_migration.sql`
   - Migrate existing data: `node scripts/migrate-to-supabase.js`

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Deployment

### Vercel (Recommended for Start)
1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### VPS + Supabase (Scaling Option)
For high traffic scenarios:
1. **Frontend**: Deploy to VPS (DigitalOcean/AWS Lightsail)
2. **Database**: Continue with Supabase
3. **Edge Functions**: Keep Supabase Edge Functions
4. **CDN**: Add Cloudflare for better performance

## Scaling Strategy

### Phase 1: Vercel Pro ($20/month)
- Unlimited commercial use
- Better performance for < 100K requests/month

### Phase 2: VPS + Supabase ($10-30/month)
- Frontend on VPS for Indian traffic
- Keep Supabase for database and edge functions
- Add Cloudflare CDN

### Phase 3: High Traffic (50K+ users/month)
- Consider self-hosted Supabase
- Database read replicas
- Load balancing

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript check
```

## Project Structure

```bash
src/
├── app/              # Next.js app router pages
├── components/       # Reusable React components
├── lib/             # Utility functions and configurations
├── hooks/           # Custom React hooks
└── styles/          # Global styles

supabase/
├── functions/       # Edge functions (15 functions)
├── migrations/      # Database migrations
└── schema.sql       # Database schema
```

## Edge Functions

- **Products**: Product management and CRUD operations
- **Orders**: Order processing and management
- **Payments**: Cashfree payment integration
- **Shipping**: Shiprocket webhook handling
- **Notifications**: Email and WhatsApp notifications
- **Admin**: Admin panel operations

## UI Components

- Modern design with Tailwind CSS
- Dark mode support
- Responsive for all devices
- Accessibility focused
- Custom animations and transitions

## License

This project is proprietary and owned by Woody Business.

## Support

For support, contact:
- Email: support@woody.co.in
- Phone: +91 6261603067
