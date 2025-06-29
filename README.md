# BidBase - Government Procurement Made Simple

BidBase is the go-to platform for young entrepreneurs and emerging consultants to discover and win public sector opportunities. We make government procurement accessible, engaging, and achievable for the next generation of business leaders.

## 🚀 Features

- **Smart Opportunity Discovery**: Browse and search government tenders with intelligent filtering
- **Bookmark & Track**: Save interesting opportunities and track application deadlines
- **Real-time Updates**: Automatic synchronization with government procurement systems
- **Mobile-First Design**: Optimized for entrepreneurs on the go
- **Admin Dashboard**: Comprehensive system management and analytics
- **Advanced Analytics**: PostHog integration for user behavior insights and product optimization

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **State Management**: TanStack Query (React Query)
- **Analytics**: PostHog for product analytics and user insights
- **Icons**: Lucide React
- **Build Tool**: Vite

## 🏗 Architecture

### Frontend
- Modern React with TypeScript for type safety
- TanStack Query for server state management and caching
- Tailwind CSS for responsive, utility-first styling
- Component-based architecture with clear separation of concerns
- PostHog integration for comprehensive analytics tracking

### Backend
- Supabase for database, authentication, and serverless functions
- PostgreSQL with Row Level Security (RLS) for data protection
- Edge Functions for data synchronization and processing
- Real-time subscriptions for live updates

### Analytics
- PostHog for product analytics, user behavior tracking, and feature flags
- Event tracking for user interactions, tender views, bookmarks, and conversions
- Performance monitoring and error tracking
- A/B testing capabilities through feature flags

### Data Flow
1. **Data Ingestion**: Automated sync from government APIs via Edge Functions
2. **Processing**: Data transformation and enrichment
3. **Storage**: Structured storage in PostgreSQL with full-text search
4. **API**: RESTful API with real-time capabilities
5. **Frontend**: Reactive UI with optimistic updates and caching
6. **Analytics**: Comprehensive event tracking and user behavior analysis

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- PostHog account (for analytics)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/bidbase.git
cd bidbase
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your credentials in `.env`:
```
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# PostHog Analytics
VITE_POSTHOG_API_KEY=your_posthog_api_key
VITE_POSTHOG_HOST=https://app.posthog.com

# Optional
VITE_POSTHOG_DEV_ENABLED=false
VITE_APP_VERSION=1.0.0
```

5. Start the development server:
```bash
npm run dev
```

## 📊 Analytics Setup

### PostHog Configuration

1. **Create PostHog Account**: Sign up at [posthog.com](https://posthog.com)
2. **Get API Key**: Copy your project API key from PostHog settings
3. **Configure Environment**: Add your PostHog API key to `.env`
4. **Verify Setup**: Check browser console for "✅ PostHog analytics initialized"

### Tracked Events

The application tracks comprehensive user interactions:

- **Authentication**: Sign up, sign in, sign out
- **Tender Discovery**: Views, searches, filtering
- **Bookmarks**: Add/remove bookmarks, bookmark page views
- **Documents**: Downloads and views
- **Navigation**: Page views, external link clicks
- **Errors**: Application errors with context
- **Performance**: Page load times and performance metrics

### Feature Flags

PostHog feature flags are integrated for:
- A/B testing new features
- Gradual feature rollouts
- Emergency feature toggles

Access feature flags in components:
```typescript
import { isFeatureEnabled } from '../lib/analytics';

const showNewFeature = isFeatureEnabled('new-feature-flag');
```

## 📊 Database Schema

### Core Tables
- **tenders**: Government opportunities with full metadata
- **bookmarks**: User-saved opportunities
- **fetch_logs**: Sync operation tracking and analytics

### Key Features
- Full-text search across tender content
- Automated data synchronization
- User authentication and authorization
- Admin analytics and monitoring
- Province and industry filtering
- Vector search capabilities for semantic matching

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Organization
```
src/
├── components/          # React components
│   ├── admin/          # Admin-specific components
│   └── ...
├── hooks/              # Custom React hooks including analytics
├── lib/                # Utilities and configurations
│   ├── analytics.ts    # PostHog analytics setup and helpers
│   ├── queries.ts      # TanStack Query hooks
│   └── supabase.ts     # Supabase client and helpers
├── providers/          # React context providers
└── types/              # TypeScript type definitions
```

### Analytics Integration

The analytics system is built with type safety and comprehensive tracking:

```typescript
// Track custom events
import { trackEvent } from '../lib/analytics';

trackEvent('tender_viewed', {
  tender_ocid: tender.ocid,
  tender_title: tender.title,
  source: 'search'
});

// Use analytics hooks
import { useTenderTracking } from '../hooks/useAnalytics';

const { trackTenderView, trackTenderBookmark } = useTenderTracking();
```

## 🚀 Deployment

### Frontend Deployment
The application can be deployed to any static hosting service:

1. Build the application:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service

### Backend (Supabase)
1. Set up your Supabase project
2. Run database migrations
3. Deploy Edge Functions
4. Configure environment variables

### Analytics (PostHog)
1. Create PostHog project
2. Configure data retention and privacy settings
3. Set up dashboards and insights
4. Configure alerts for key metrics

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- JWT-based authentication via Supabase Auth
- API rate limiting and validation
- Secure environment variable management
- Privacy-compliant analytics with PostHog

## 📈 Performance

- Optimistic updates for instant UI feedback
- Intelligent caching with TanStack Query
- Lazy loading and code splitting
- Responsive images and assets
- Edge Function optimization for fast API responses
- Performance monitoring through PostHog

## 📊 Analytics & Insights

### Key Metrics Tracked
- User engagement and retention
- Tender discovery patterns
- Bookmark conversion rates
- Search effectiveness
- Document download rates
- User journey analysis

### Dashboards Available
- User acquisition and retention
- Feature usage analytics
- Performance monitoring
- Error tracking and resolution
- A/B test results

## 🤝 Contributing

We welcome contributions from the community! Please read our contributing guidelines and code of conduct.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Ensure analytics events are properly tracked
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♀️ Support

- **Documentation**: [docs.bidbase.co.za](https://docs.bidbase.co.za)
- **Community**: [community.bidbase.co.za](https://community.bidbase.co.za)
- **Email**: support@bidbase.co.za

## 🌟 Mission

BidBase exists to democratize access to government procurement opportunities. We believe that with the right tools, information, and insights, emerging businesses can compete effectively in the public sector and drive economic growth.

---

**Built with ❤️ for the next generation of business leaders**