# BidBase - Government Procurement Made Simple

BidBase is the go-to platform for young entrepreneurs and emerging consultants to discover and win public sector opportunities. We make government procurement accessible, engaging, and achievable for the next generation of business leaders.

## 🚀 Features

- **Smart Opportunity Discovery**: Browse and search government tenders with intelligent filtering
- **Bookmark & Track**: Save interesting opportunities and track application deadlines
- **Real-time Updates**: Automatic synchronization with government procurement systems
- **Mobile-First Design**: Optimized for entrepreneurs on the go
- **Admin Dashboard**: Comprehensive system management and analytics

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **State Management**: TanStack Query (React Query)
- **Icons**: Lucide React
- **Build Tool**: Vite

## 🏗 Architecture

### Frontend
- Modern React with TypeScript for type safety
- TanStack Query for server state management and caching
- Tailwind CSS for responsive, utility-first styling
- Component-based architecture with clear separation of concerns

### Backend
- Supabase for database, authentication, and serverless functions
- PostgreSQL with Row Level Security (RLS) for data protection
- Edge Functions for data synchronization and processing
- Real-time subscriptions for live updates

### Data Flow
1. **Data Ingestion**: Automated sync from government APIs via Edge Functions
2. **Processing**: Data transformation and enrichment
3. **Storage**: Structured storage in PostgreSQL with full-text search
4. **API**: RESTful API with real-time capabilities
5. **Frontend**: Reactive UI with optimistic updates and caching

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

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

4. Configure your Supabase credentials in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
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
├── lib/                # Utilities and configurations
│   ├── queries.ts      # TanStack Query hooks
│   └── supabase.ts     # Supabase client and helpers
├── providers/          # React context providers
└── types/              # TypeScript type definitions
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

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- JWT-based authentication via Supabase Auth
- API rate limiting and validation
- Secure environment variable management

## 📈 Performance

- Optimistic updates for instant UI feedback
- Intelligent caching with TanStack Query
- Lazy loading and code splitting
- Responsive images and assets
- Edge Function optimization for fast API responses

## 🤝 Contributing

We welcome contributions from the community! Please read our contributing guidelines and code of conduct.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♀️ Support

- **Documentation**: [docs.bidbase.co.za](https://docs.bidbase.co.za)
- **Community**: [community.bidbase.co.za](https://community.bidbase.co.za)
- **Email**: support@bidbase.co.za

## 🌟 Mission

BidBase exists to democratize access to government procurement opportunities. We believe that with the right tools and information, emerging businesses can compete effectively in the public sector and drive economic growth.

---

**Built with ❤️ for the next generation of business leaders**