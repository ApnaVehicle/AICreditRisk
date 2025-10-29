# Credit Risk Monitoring Agentic AI Platform

A comprehensive credit risk monitoring and management system powered by AI agents, built for NBFCs and financial institutions. This platform provides real-time portfolio monitoring, intelligent risk assessment, and proactive alerts.

## Features

- **Real-time Dashboard**: Comprehensive portfolio analytics with live updates and interactive charts
- **AI-Powered Agent**: Conversational AI for natural language queries about credit risk
- **Risk Scoring Engine**: Multi-factor risk assessment with delinquency, credit profile, and concentration analysis
- **Proactive Alerts**: Early warning system for high-risk loans and portfolio concentration
- **Advanced Analytics**: DPD trends, sector exposure, and geographic risk analysis
- **Loan Explorer**: Detailed loan-level information with advanced filtering

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (development), PostgreSQL-ready schema
- **AI Agent**: LangChain.js with OpenAI API
- **Charts**: Recharts
- **UI Components**: shadcn/ui patterns (manually implemented)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key (get one at https://platform.openai.com/api-keys)

### Installation

1. **Clone and Install Dependencies**
```bash
npm install --legacy-peer-deps
```

2. **Configure Environment Variables**

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenAI API key:
```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your_openai_api_key_here"
OPENAI_MODEL="gpt-4-turbo"
NODE_ENV="development"
```

3. **Setup Database**

Generate Prisma client:
```bash
npx prisma generate
```

Push schema to database:
```bash
DATABASE_URL="file:./dev.db" npx prisma db push
```

Seed database with sample data (1000 loans, 500 customers):
```bash
DATABASE_URL="file:./dev.db" npx prisma db seed
```

4. **Start Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Overview

The system is pre-seeded with realistic financial data:

- **500 Customers**: Realistic age, income, and credit score distributions
- **1,000 Loans**: Across 6 sectors (Manufacturing, Retail, IT, Healthcare, Real Estate, Agriculture)
- **11,000+ Repayments**: Varied payment patterns with realistic DPD scenarios
- **1,000 Risk Assessments**: Comprehensive risk scores and categorizations

### Data Distributions

- **Risk Categories**: 68.3% Active, 11.3% High Risk, 1.8% NPA
- **Sectors**: Manufacturing (25%), IT (20%), Healthcare (18%), Retail (15%), Real Estate (12%), Agriculture (10%)
- **Credit Scores**: Bell curve distribution (mean: 680, std dev: 70)
- **Geographies**: Mumbai (25%), Delhi (20%), Bangalore (18%), Pune (12%), Hyderabad (10%), Others (15%)

## Application Pages

### Home Page (`/`)
Premium landing page showcasing platform features and capabilities:
- Hero section with gradient backgrounds
- 6 feature cards with detailed descriptions
- Portfolio statistics (1,000 loans, ₹50Cr+ under management)
- Call-to-action sections

### Dashboard (`/dashboard`)
Real-time portfolio monitoring with interactive analytics:
- **Key Metrics**: Total Exposure, NPA Rate, High Risk Loans, Average Risk Score
- **Risk Distribution Chart**: Pie chart showing LOW/MEDIUM/HIGH risk breakdown
- **Delinquency Metrics**: 30-60-90 day buckets with visual indicators
- **Sector Exposure**: Bar chart showing loan amounts by sector
- **Critical Alerts**: High-priority alerts requiring immediate attention

### AI Chat (`/chat`)
Conversational AI interface for natural language queries:
- Multi-turn conversations with context retention
- Example queries: "Show me top 5 high-risk loans", "What's our NPA rate?"
- 7 built-in tools: High Risk Loans, DPD Trends, Sector Exposure, Geographic Risk, Portfolio Summary, Loan Details, Alert Creation
- Copy message functionality

### Loan Explorer (`/loans`)
Comprehensive loan portfolio browser:
- Filterable table (All, High Risk, Medium Risk, Low Risk)
- Detailed loan information: Customer, Amount, Outstanding, Sector, Status, Risk Score, DPD
- Color-coded risk indicators
- Responsive data table

## API Endpoints

### Loans
- `GET /api/loans/high-risk?limit=10&sector=IT&minRiskScore=60` - Get high-risk loans
- `GET /api/loans/[id]` - Get detailed loan information

### Analytics
- `GET /api/analytics/portfolio-summary` - Overall portfolio health metrics
- `GET /api/analytics/sector-exposure` - Sector-wise exposure analysis
- `GET /api/analytics/geographic-risk` - Geographic distribution and risk
- `GET /api/analytics/dpd-trends?months=6&sector=IT` - DPD trends over time

### Alerts
- `GET /api/alerts` - Fetch active alerts
- `POST /api/alerts` - Create new risk alert

### AI Agent
- `POST /api/agent/chat` - Conversational AI endpoint with multi-turn support

## Risk Scoring Methodology

The risk engine uses a composite scoring model (0-100):

- **40% Delinquency Risk**: Based on DPD, payment patterns, consecutive delays
- **30% Credit Profile**: Credit score, DTI ratio, employment status
- **20% Loan Characteristics**: Loan amount, outstanding balance, duration
- **10% Concentration Risk**: Sector, geographic, and customer concentration

### Risk Categories
- **LOW (0-35)**: Green - Healthy loans with minimal risk
- **MEDIUM (36-65)**: Amber - Moderate risk requiring monitoring
- **HIGH (66-100)**: Red - Critical risk requiring immediate action

### Alert Triggers
- Risk score > 80
- DPD > 60 days
- Sector concentration > 30%
- Geographic concentration > 35%
- NPA risk (DPD > 90 days)

## Project Structure

```
assessment_dev/
├── app/
│   ├── api/              # API routes
│   │   ├── agent/        # AI agent endpoint
│   │   ├── alerts/       # Alert management
│   │   ├── analytics/    # Analytics endpoints
│   │   └── loans/        # Loan data endpoints
│   ├── chat/             # AI chat interface
│   ├── dashboard/        # Analytics dashboard
│   ├── loans/            # Loan explorer
│   ├── page.tsx          # Landing page
│   └── globals.css       # Global styles
├── components/
│   └── ui/               # UI components (button, card, badge, tabs)
├── lib/
│   ├── agent/            # AI agent (LangChain + OpenAI)
│   │   ├── agent.ts      # Agent orchestration
│   │   ├── tools.ts      # LangChain tools
│   │   └── prompts.ts    # System prompts
│   ├── risk-engine/      # Risk assessment engine
│   │   ├── delinquency.ts
│   │   ├── concentration.ts
│   │   ├── scoring.ts
│   │   └── types.ts
│   ├── db.ts             # Prisma client singleton
│   └── utils.ts          # Utility functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Data generation script
├── claude.md             # Comprehensive technical documentation
├── GETTING_STARTED.md    # Step-by-step implementation guide
└── README.md             # This file
```

## Development

### Browse Database
```bash
npx prisma studio
```

### Reset Database
```bash
rm dev.db
DATABASE_URL="file:./dev.db" npx prisma db push
DATABASE_URL="file:./dev.db" npx prisma db seed
```

### Test API Endpoints
```bash
# Get portfolio summary
curl http://localhost:3000/api/analytics/portfolio-summary

# Get high-risk loans
curl http://localhost:3000/api/loans/high-risk?limit=5

# Test AI agent
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is our current NPA rate?"}'
```

### Build for Production
```bash
npm run build
npm run start
```

## Documentation

- **[claude.md](./claude.md)**: Complete technical documentation with architecture, database design, API specifications, and implementation details
- **[GETTING_STARTED.md](./GETTING_STARTED.md)**: Detailed step-by-step implementation guide

## Troubleshooting

### Dependency Installation Issues
If you encounter dependency conflicts, always use the `--legacy-peer-deps` flag:
```bash
npm install --legacy-peer-deps
```

### Database Connection Errors
Ensure DATABASE_URL is set correctly in `.env.local`:
```env
DATABASE_URL="file:./dev.db"
```

For Prisma commands, prefix with the environment variable:
```bash
DATABASE_URL="file:./dev.db" npx prisma db push
```

### OpenAI API Errors
- **401 Unauthorized**: Check your OPENAI_API_KEY in `.env.local`
- **429 Rate Limit**: Wait a moment before retrying or upgrade your OpenAI plan
- **Missing API Key**: Get one at https://platform.openai.com/api-keys

### Port Already in Use
If port 3000 is already in use:
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

## Key Features Demonstrated

This project showcases:

1. **BFSI Domain Understanding**: Proper modeling of credit risk concepts (DPD, NPA, concentration risk, risk scoring)
2. **AI Agent Architecture**: LangChain-powered conversational AI with 7 specialized tools
3. **Real-world Data Modeling**: Realistic distributions for customers, loans, and repayments
4. **Risk Engine Implementation**: Multi-factor risk scoring with business logic
5. **Professional UI/UX**: Premium, production-ready interface using modern design patterns
6. **API Design**: RESTful endpoints with proper error handling and response formats
7. **Type Safety**: End-to-end TypeScript with Prisma for database type safety

## License

This project was created as a take-home assessment for demonstrating NBFC/lender credit risk monitoring capabilities.

## Contact

For questions or feedback about this implementation, please refer to the comprehensive documentation in `claude.md`.

---

**Built with**: Next.js, TypeScript, Prisma, LangChain, OpenAI, Recharts, Tailwind CSS
