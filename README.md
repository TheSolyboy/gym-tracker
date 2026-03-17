# 💪 Gym Tracker

A personal gym progress tracker with photo upload, body measurements, and a monthly calendar view. Built with Next.js 14, Discord OAuth, and file-based JSON storage.

## Features

- 📅 Monthly calendar view with progress photos as tile backgrounds
- 📸 Photo upload per day (replaces existing)
- 📏 Body measurements: weight, height, BMI (auto-calc), body fat, biceps, chest, waist, hips, neck, thighs
- 🔐 Discord OAuth authentication
- 🌑 Dark gym aesthetic
- 📱 Mobile responsive

## Setup

### 1. Prerequisites

- Node.js 20+
- Discord application with OAuth2 set up

### 2. Discord OAuth

1. Go to https://discord.com/developers/applications
2. Create a new application
3. Go to OAuth2 → General
4. Add redirect URL: `https://YOUR_DOMAIN/api/auth/callback/discord`
5. Copy Client ID and Client Secret

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-random-secret-here  # generate with: openssl rand -base64 32
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DATA_DIR=/data
PORT=3015
```

### 4. Local Development

```bash
npm install
npm run dev
# App runs on http://localhost:3015
```

### 5. Docker Deployment

```bash
# Build and run with docker-compose
cp .env.example .env
# Edit .env with your values
docker-compose up -d
```

Or manually:

```bash
docker build -t gym-tracker .
docker run -d \
  -p 3015:3015 \
  -v gym-data:/data \
  -e NEXTAUTH_URL=https://your-domain.com \
  -e NEXTAUTH_SECRET=your-secret \
  -e DISCORD_CLIENT_ID=your-id \
  -e DISCORD_CLIENT_SECRET=your-secret \
  gym-tracker
```

## Data Storage

All data is stored in `DATA_DIR` (default: `/data`):

```
/data/
  users/
    {discordUserId}/
      profile.json          # height and other persistent profile data
      entries/
        2024-01-15.json     # daily measurements
      photos/
        2024-01-15.jpg      # progress photos
```

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **NextAuth.js v4** for Discord OAuth
- **JSON files** for data storage (no database)
- **Docker** with multi-stage build, standalone output

## Port

The app runs on **port 3015**.
