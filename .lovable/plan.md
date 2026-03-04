

# PRESENCIA — Landing Page & Onboarding MVP

## Overview
A polished, clean & modern landing page that communicates Presencia's value proposition, plus a complete sign-up/login flow so users can create accounts and access the platform.

## Pages & Features

### 1. Landing Page (`/`)
- **Hero section** — Bold headline: "Communicate with intention. Impact with intelligence." with a clear CTA ("Get Started Free")
- **How it works** — 4-step visual flow: Idea → Script → Record → Improve, with icons and short descriptions
- **Who it's for** — Cards for target users (Entrepreneurs, Creators, Professionals, Educators)
- **Value proposition section** — Key benefits: AI coaching, strategic storytelling, speaking analysis
- **Footer** — Links, copyright, social placeholders

### 2. Authentication (`/auth`)
- Sign up with email & password
- Login with email & password
- Password reset flow (forgot password + `/reset-password` page)
- User profiles table to store name and avatar for future use

### 3. Dashboard (`/dashboard`) — Post-login landing
- Welcome screen with user's name
- Placeholder cards for future features (Create Script, My Recordings, Progress)
- "Coming soon" state for core features

## Backend (Lovable Cloud)
- Supabase authentication (email/password)
- `profiles` table (id, full_name, avatar_url, created_at) with auto-creation trigger
- RLS policies for profile security
- Protected routes — redirect unauthenticated users to `/auth`

## Design Direction
- Clean white backgrounds with subtle gray tones
- Modern sans-serif typography
- Accent color: a sophisticated blue or indigo (refinable later with your branding)
- Smooth animations on scroll for landing page sections
- Fully responsive (mobile-first)

