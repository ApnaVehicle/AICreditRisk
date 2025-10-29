# Getting Started with Credit Risk Monitoring AI

This guide will walk you through setting up and running the Credit Risk Monitoring Agentic AI system step by step.

## Prerequisites

Before you begin, make sure you have:
- **Node.js** 18+ installed ([Download here](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Anthropic API Key** for Claude AI ([Get one here](https://console.anthropic.com/))
- A code editor (VS Code recommended)
- Terminal/Command line access

---

## Step 1: Verify Project Setup

You should already have a Next.js app initialized. Let's verify:

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Verify project files
ls -la
```

You should see: `package.json`, `app/`, `next.config.ts`, etc.

---

## Step 2: Install Dependencies

Install all required packages for the project:

```bash
# Install database and ORM
npm install @prisma/client
npm install -D prisma

# Install AI and LangChain
npm install langchain @langchain/anthropic @langchain/core

# Install UI components and charts
npm install recharts

# Install utilities
npm install zod date-fns uuid
npm install -D @types/uuid
```

**Expected Result:** All packages installed successfully, no errors in terminal.

---

## Step 3: Initialize shadcn/ui

shadcn/ui is already installed, but we need to configure it properly:

```bash
# Initialize shadcn/ui (follow the prompts)
npx shadcn@latest init
```

**When prompted, choose:**
- Style: `Default`
- Base color: `Slate`
- CSS variables: `Yes`

Then install the required components:

```bash
# Install all UI components we'll need
npx shadcn@latest add button card table badge dialog alert input label select
```

**Expected Result:** Components installed in `components/ui/` directory.

---

## Step 4: Setup Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.example .env.local
```

Now edit `.env.local` and add your API keys:

```env
# Database
DATABASE_URL="file:./dev.db"

# Anthropic API (required for Claude AI)
ANTHROPIC_API_KEY="your_actual_api_key_here"

# Application
NODE_ENV="development"
```

**Important:**
- Replace `your_actual_api_key_here` with your real Anthropic API key
- Never commit `.env.local` to git (it's already in `.gitignore`)

**Get Anthropic API Key:**
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new key
5. Copy and paste into `.env.local`

---

## Step 5: Initialize Prisma Database

Now let's set up the database:

```bash
# Initialize Prisma (creates prisma/ directory)
npx prisma init --datasource-provider sqlite
```

**Expected Result:** `prisma/` directory created with `schema.prisma` file.

The schema file should already be created (from our project setup). Let's verify:

```bash
# View the schema
cat prisma/schema.prisma
```

You should see 4 models: `Customer`, `Loan`, `Repayment`, `RiskAssessment`.

---

## Step 6: Generate Prisma Client

Generate the Prisma client (TypeScript types and functions):

```bash
# Generate Prisma client
npx prisma generate
```

**Expected Result:** Prisma client generated in `node_modules/@prisma/client/`.

---

## Step 7: Create Database and Seed Data

Now let's create the database and populate it with realistic data:

```bash
# Push the schema to database (creates dev.db file)
npx prisma db push
```

**Expected Result:** `prisma/dev.db` file created (your SQLite database).

Now seed the database with 1000 loans across 500 customers:

```bash
# Run the seed script
npx prisma db seed
```

**Expected Result:**
- Terminal output showing progress (creating customers, loans, repayments, risk assessments)
- "Database seeded successfully!" message
- Should take 10-30 seconds depending on your machine

**Verify the data:**

```bash
# Open Prisma Studio to browse the database
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can browse all your data.

**Check:**
- Customers table: 500 records
- Loans table: 1000 records
- Repayments table: Multiple records per loan
- RiskAssessments table: 1000 records

Press `Ctrl+C` to close Prisma Studio when done.

---

## Step 8: Run the Development Server

Now let's start the Next.js development server:

```bash
# Start the dev server
npm run dev
```

**Expected Result:**
- Server starts on `http://localhost:3000`
- Terminal shows: "✓ Ready in X ms"
- No errors

Open your browser and go to: **http://localhost:3000**

You should see the home page of the Credit Risk Monitoring system.

---

## Step 9: Test the Application

### Test the Dashboard

1. Go to: **http://localhost:3000/dashboard**
2. You should see:
   - Portfolio overview cards (total loans, at-risk loans, NPA rate)
   - Charts showing sector distribution, DPD trends
   - Recent alerts widget
   - High-risk loans table

### Test the Chat Interface

1. Go to: **http://localhost:3000/chat**
2. Try asking the AI agent:
   - "Show me top 10 high-risk loans"
   - "What's the DPD trend in manufacturing sector?"
   - "Which region has highest overdue exposure?"
3. The agent should respond with data from your database

### Test the Loans Explorer

1. Go to: **http://localhost:3000/loans**
2. You should see:
   - Table with all 1000 loans
   - Filters for sector, status, risk category
   - Search box for customer names
   - Click on a loan to see details

---

## Step 10: Test API Endpoints (Optional)

You can test the API endpoints directly using curl or Postman:

```bash
# Test high-risk loans endpoint
curl http://localhost:3000/api/loans/high-risk?limit=5

# Test portfolio summary
curl http://localhost:3000/api/analytics/portfolio-summary

# Test DPD trends
curl http://localhost:3000/api/analytics/dpd-trends

# Test sector exposure
curl http://localhost:3000/api/analytics/sector-exposure

# Test geographic risk
curl http://localhost:3000/api/analytics/geographic-risk
```

**Expected Result:** JSON responses with data from your database.

---

## Common Commands Reference

Here's a quick reference of commands you'll use frequently:

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Run production build
npm run lint             # Run ESLint

# Database
npx prisma studio        # Open database browser
npx prisma db push       # Update database schema
npx prisma db seed       # Reseed database
npx prisma generate      # Regenerate Prisma client
npx prisma migrate dev   # Create migration (for production)

# Database Reset (if needed)
npx prisma db push --force-reset   # WARNING: Deletes all data!
npx prisma db seed                  # Re-seed after reset

# Git
git status              # Check file changes
git add .               # Stage all changes
git commit -m "message" # Commit changes
```

---

## Project Structure Quick Reference

```
assessment_dev/
├── app/                    # Next.js pages and routes
│   ├── api/               # API endpoints
│   ├── dashboard/         # Dashboard page
│   ├── chat/              # Chat interface page
│   ├── loans/             # Loans explorer page
│   └── page.tsx           # Home page
│
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── charts/           # Chart components
│   ├── dashboard/        # Dashboard widgets
│   ├── chat/             # Chat components
│   └── tables/           # Data tables
│
├── lib/                   # Business logic
│   ├── db.ts             # Prisma client
│   ├── risk-engine/      # Risk calculation functions
│   └── agent/            # AI agent logic
│
├── prisma/                # Database
│   ├── schema.prisma     # Database schema
│   ├── seed.ts           # Data generation
│   └── dev.db            # SQLite database file
│
├── .env.local            # Environment variables (YOU CREATE THIS)
├── .env.example          # Environment template
├── claude.md             # Complete documentation
└── GETTING_STARTED.md    # This file
```

---

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"

**Solution:**
```bash
npx prisma generate
```

### Error: "ANTHROPIC_API_KEY is not defined"

**Solution:**
1. Make sure `.env.local` exists
2. Make sure you added your API key
3. Restart the dev server (`Ctrl+C` then `npm run dev`)

### Error: "Database not found"

**Solution:**
```bash
npx prisma db push
npx prisma db seed
```

### Error: Port 3000 already in use

**Solution:**
```bash
# Kill the process using port 3000
npx kill-port 3000

# Or use a different port
PORT=3001 npm run dev
```

### Database has no data

**Solution:**
```bash
# Reseed the database
npx prisma db seed
```

### Seed script not running

**Solution:**

Make sure `package.json` has this section:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

If missing, add it and install tsx:

```bash
npm install -D tsx
```

### Charts not showing

**Solution:**
1. Check browser console for errors (F12)
2. Make sure API endpoints are returning data
3. Test API endpoints with curl (see Step 10)

---

## Next Steps

Now that you have the system running, you can:

1. **Explore the Data**
   - Use Prisma Studio: `npx prisma studio`
   - Browse customers, loans, repayments
   - Understand the risk scores

2. **Customize the Risk Engine**
   - Edit `lib/risk-engine/scoring.ts` to adjust risk calculation
   - Modify thresholds in `lib/risk-engine/delinquency.ts`
   - Add new risk factors

3. **Enhance the AI Agent**
   - Add new tools in `lib/agent/tools.ts`
   - Improve prompts in `lib/agent/prompts.ts`
   - Add more conversation capabilities

4. **Improve the UI**
   - Customize colors in `app/globals.css`
   - Add more charts to dashboard
   - Enhance the chat interface

5. **Prepare for Presentation**
   - Create demo scenarios
   - Prepare talking points
   - Record screen demo

---

## Development Tips

1. **Keep Dev Server Running**
   - Next.js auto-reloads on file changes
   - No need to restart unless you change `.env.local`

2. **Use Prisma Studio**
   - Great for browsing data during development
   - Can edit records directly
   - Useful for debugging

3. **Check Browser Console**
   - Press F12 to open DevTools
   - Look for errors in Console tab
   - Network tab shows API calls

4. **Test API Endpoints First**
   - Before building UI, test APIs with curl
   - Easier to debug backend separately
   - Use Postman for complex requests

5. **Git Commits**
   - Commit after each feature
   - Use descriptive commit messages
   - Example: "Add high-risk loans API endpoint"

---

## Resources

- **Project Documentation**: See [claude.md](claude.md) for complete architecture
- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **LangChain Docs**: https://js.langchain.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Recharts**: https://recharts.org

---

## Getting Help

If you encounter issues:

1. Check the error message carefully
2. Look in the Troubleshooting section above
3. Check [claude.md](claude.md) for architecture details
4. Search error messages on Google/Stack Overflow
5. Check if API endpoints are working (use curl)
6. Verify database has data (use Prisma Studio)

---

## Quick Start Checklist

Use this checklist to make sure everything is set up:

- [ ] Node.js 18+ installed
- [ ] All dependencies installed (`npm install`)
- [ ] shadcn/ui initialized and components installed
- [ ] `.env.local` created with Anthropic API key
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Database created (`npx prisma db push`)
- [ ] Database seeded with 1000 loans (`npx prisma db seed`)
- [ ] Dev server running (`npm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Dashboard shows data and charts
- [ ] Chat interface responds to queries
- [ ] Loans table displays 1000 loans
- [ ] API endpoints return data (test with curl)

---

**Congratulations!** 🎉

If you've completed all steps, you now have a fully functional Credit Risk Monitoring AI system running locally!

**Time to complete:** Approximately 30-60 minutes for first-time setup.

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
