# MeetHalf 🎯

A smart meeting planner that finds the fairest meeting location for groups where everyone has different travel modes.

## Features

- **Multi-person support** - Plan meetings with 2-8+ people
- **Per-person travel modes** - Mix driving 🚗, transit 🚇, and walking 🚶
- **Smart venue suggestions** - Get top 5 places sorted by fairness
- **Real-time travel times** - See exact minutes for each person
- **Interactive map** - Visual display of participants and suggested venues
- **Venue details** - Ratings, price levels, and open hours 

## Why MeetHalf?

Existing apps like MeetWays and Midpointr have limitations:
- Limited to 2-3 people
- Force everyone to use the same travel mode
- Don't show per-person times for each venue option

**MeetHalf solves all of these!**

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **APIs**: Google Maps Platform (Maps JavaScript API, Places API, Directions API, Geocoding API)
- **Deployment**: Vercel (coming soon)

## Installation

1. **Clone the repository**
```bash
   git clone https://github.com/Gherra/MeetHalf.git
   cd MeetHalf
```

2. **Install dependencies**
```bash
   npm install
```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
```
   NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_browser_api_key_here
   GOOGLE_MAPS_SERVER_KEY=your_server_api_key_here
```

   Get your API keys from [Google Cloud Console](https://console.cloud.google.com/)

4. **Run the development server**
```bash
   npm run dev
```

5. **Open** [http://localhost:3000](http://localhost:3000)

## How to Use

1. **Create a meeting** - Set a title and choose venue type (café, restaurant, library, park)
2. **Add participants** - Enter names, addresses (with autocomplete), and travel modes
3. **Find best places** - Click the button and wait ~5-10 seconds
4. **View results** - See top 5 venues with travel times for each person
5. **Pick a spot** - Click "Open in Google Maps" to navigate

## Screenshots

Coming soon!

## API Keys Setup

You'll need two Google Maps API keys:

**Browser Key** (for maps & autocomplete):
- HTTP referrer restriction to your domain
- Enable: Maps JavaScript API, Places API, Geocoding API

**Server Key** (for backend API calls):
- No restrictions or IP-based restrictions
- Enable: Places API, Directions API

Set billing budget alerts to avoid unexpected charges!

## Algorithm

MeetHalf uses a **balanced fairness algorithm**:

1. **Calculate center point** - Geometric average of all participant locations
2. **Search nearby venues** - Query Google Places API within 3km radius
3. **Get travel times** - For each venue, calculate travel time for each person using their chosen mode (driving/transit/walking)
4. **Calculate fairness metrics**:
   - Average time: mean of all travel times
   - Max time: longest individual travel time
5. **Sort by average time** - Prioritizes venues that are fastest for the group overall
6. **Highlight fair options** - Badge venues where the spread (max - min) ≤ 5 minutes

**Why average time?** It balances everyone's convenience rather than just minimizing distance. A venue 15 min for everyone beats one that's 5 min for one person but 40 min for another!
