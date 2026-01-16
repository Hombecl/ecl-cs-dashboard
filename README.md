# CS Dashboard

Customer Service Dashboard for Walmart marketplace - view and manage customer inquiries with AI-powered draft replies.

## Features

- **Case Management**: View all CS cases in one place, filter by status
- **Order Integration**: Automatically links customer messages to orders from Airtable
- **Tracking Display**: Shows 17Track delivery status directly in the dashboard
- **AI Draft Replies**: Generate personalized responses based on store personas
- **Playbook System**: Guided responses based on issue category

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Airtable
- **AI**: Claude (Anthropic) for message analysis and reply generation
- **Hosting**: Vercel

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/Hombecl/cs-dashboard.git
cd cs-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Airtable
AIRTABLE_API_KEY=your_airtable_personal_access_token
AIRTABLE_BASE_ID=appRCQASsApV4C33N

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key
```

#### Getting your Airtable API Key:
1. Go to https://airtable.com/create/tokens
2. Create a new personal access token
3. Add scopes: `data.records:read`, `data.records:write`
4. Add access to your "ECL Order Management" base

#### Getting your Anthropic API Key:
1. Go to https://console.anthropic.com/
2. Create an API key

### 4. Run locally

```bash
npm run dev
```

Open http://localhost:3000

### 5. Deploy to Vercel

#### Option A: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel
```

#### Option B: Deploy via GitHub

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/Hombecl/cs-dashboard.git
git push -u origin main
```

2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard:
   - `AIRTABLE_API_KEY`
   - `AIRTABLE_BASE_ID`
   - `ANTHROPIC_API_KEY`
5. Deploy!

## Airtable Setup

The dashboard uses these tables in your ECL Order Management base:

### CS Cases (created automatically)
- Stores customer service cases
- Links to orders via Platform Order Number

### CS Messages (created automatically)
- Stores conversation history for each case

### CS Playbook (created automatically)
- Stores response templates and decision trees

### Store (updated with Persona fields)
- Added fields for CS persona configuration

## Usage

### Creating Cases
Cases can be created via:
1. **API**: POST to `/api/cases` with case data
2. **n8n Workflow**: Automatically create cases from email parsing (to be set up)

### Managing Cases
1. Select a case from the left panel
2. View customer info, order details, and tracking status
3. Click "Generate" to create an AI draft reply
4. Edit the reply as needed
5. Copy and paste into Walmart Seller Center
6. Use action buttons to mark replacement/refund/resolved

### Setting Up Personas
1. Go to your Store table in Airtable
2. Fill in the Persona fields for each store:
   - Persona Name (e.g., "Jennifer")
   - Persona Age
   - Persona Location
   - Personality Traits
   - Writing Style
   - Greeting Template
   - Signoff Template

## Next Steps

- [ ] Set up n8n workflow to parse incoming emails
- [ ] Configure store personas in Airtable
- [ ] Create playbook entries for common scenarios
- [ ] Set up email notifications for new cases

## Support

For any issues or questions, contact the development team.
