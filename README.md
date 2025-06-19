
# 🍽️ Restaurant Waitlist System - Line-up

A modern, real-time digital waitlist system for restaurants. Guests can join the queue by scanning a QR code, receive live updates on their position, and get notified when their table is ready.

## ✨ Features

- **QR Code Landing**: Simple entry point for guests
- **Real-time Queue Updates**: Live position tracking with ETA calculations
- **Multiple Notification Channels**: SMS, phone calls, push notifications, and email
- **Progress Visualization**: Beautiful progress bars and status indicators
- **Mobile-First Design**: Optimized for smartphones
- **Auto-Removal**: Smart timeout handling for no-shows
- **Menu Integration**: Browse menu while waiting

## 🚀 Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (Postgres + Realtime + Edge Functions)
- **State Management**: TanStack Query + Zustand
- **Notifications**: Twilio + VAPID + SMTP
- **Styling**: Tailwind CSS + Framer Motion

## 🛠️ Local Development Setup

### Prerequisites

- Node.js 18+ and pnpm
- Supabase CLI
- Docker (for local Supabase)

### 1. Clone and Install

```bash
git clone <repository-url>
cd restaurant-waitlist
pnpm install
```

### 2. Start Supabase Locally

```bash
# Start local Supabase stack
supabase start

# Run migrations
supabase db reset
```

### 3. Environment Setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key
```

### 4. Deploy Edge Functions

```bash
supabase functions deploy notify-next
supabase functions deploy notify-turn  
supabase functions deploy auto-remove-no-show
```

### 5. Start Development Server

```bash
pnpm dev
```

Visit `http://localhost:3000` to see the app! 🎉

## 📱 User Flow

1. **Scan QR Code** → Land on homepage
2. **Join Waitlist** → Fill out check-in form
3. **Queue Status** → Live updates with position and ETA
4. **Notifications** → Get alerted when next in line
5. **Table Ready** → Final notification with tolerance timer
6. **Check-in Complete** → Confirmation and menu access

## 🗄️ Database Schema

### Tables

- `restaurants` - Restaurant information and settings
- `parties` - Waitlist entries with real-time position tracking

### Key Features

- **Auto-updating queue positions** via triggers
- **Row Level Security** for guest privacy
- **Real-time subscriptions** for live updates
- **Optimistic updates** for instant UX

## 🔔 Notification System

- **SMS & Calls**: Twilio integration
- **Push Notifications**: VAPID web push
- **Email**: Supabase SMTP
- **In-App**: Real-time modal alerts

## 🚀 Deployment

### Deploy to Vercel

```bash
# Connect to Vercel
vercel

# Deploy
vercel --prod
```

### Supabase Production

1. Create new project at [supabase.com](https://supabase.com)
2. Run migrations: `supabase db push`
3. Deploy functions: `supabase functions deploy --project-ref your-ref`
4. Update environment variables

## 🎨 Design System

- **Colors**: Warm oranges + cool blues
- **Typography**: Clean, mobile-optimized
- **Animations**: Smooth transitions + micro-interactions
- **Layout**: Mobile-first responsive design

## 🧪 Development Scripts

```bash
# Development
pnpm dev              # Start dev server
supabase start        # Start local Supabase

# Database
supabase db reset     # Reset with fresh data
supabase db diff      # Generate migration

# Functions
supabase functions serve  # Test functions locally
supabase functions deploy # Deploy to cloud

# Build & Deploy
pnpm build           # Production build
vercel --prod        # Deploy to Vercel
```

## 🎯 Next Steps

- [ ] Host dashboard for restaurant staff
- [ ] Multi-restaurant support
- [ ] Advanced analytics and reporting
- [ ] Integration with POS systems
- [ ] Custom branding per restaurant

---

**Built with ❤️ for better restaurant experiences**

*Questions? Check out the [Supabase docs](https://supabase.com/docs) or reach out to the team!*
