import { NextRequest, NextResponse } from 'next/server';

type Participant = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    mode: 'DRIVING' | 'TRANSIT' | 'WALKING';
};

type VenueResult = {
    placeId: string;
    name: string;
    address: string;
    rating: number;
    priceLevel: number;
    lat: number;
    lng: number;
    openNow: boolean;
    participantTimes: { [participantId: string]: number };
    averageTime: number;
    maxTime: number;
};

export async function POST(request: NextRequest) {
    try {
        const { participants, venueType } = await request.json();
        const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
        }

        // Step 1: Calculate center point
        const centerLat = participants.reduce((sum: number, p: Participant) => sum + p.lat, 0) / participants.length;
        const centerLng = participants.reduce((sum: number, p: Participant) => sum + p.lng, 0) / participants.length;

        console.log(`Center point: ${centerLat}, ${centerLng}`);

        // Step 2: Find nearby places
        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${centerLat},${centerLng}&radius=3000&type=${venueType}&key=${apiKey}`;

        const placesResponse = await fetch(placesUrl);
        const placesData = await placesResponse.json();

        if (placesData.status !== 'OK') {
            console.error('Places API error:', placesData);
            return NextResponse.json({ error: 'Failed to find places', details: placesData }, { status: 500 });
        }

        // Take top 10 places
        const topPlaces = placesData.results.slice(0, 10);

        // Step 3: Calculate travel times for each participant to each place
        const venuesWithTimes: VenueResult[] = [];

        for (const place of topPlaces) {
            const venue: VenueResult = {
                placeId: place.place_id,
                name: place.name,
                address: place.vicinity || '',
                rating: place.rating || 0,
                priceLevel: place.price_level || 0,
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
                openNow: place.opening_hours?.open_now || false,
                participantTimes: {},
                averageTime: 0,
                maxTime: 0,
            };

            // Get travel time for each participant
            const times: number[] = [];

            for (const participant of participants) {
                const travelMode = participant.mode;
                const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${participant.lat},${participant.lng}&destination=${venue.lat},${venue.lng}&mode=${travelMode.toLowerCase()}&key=${apiKey}`;

                try {
                    const directionsResponse = await fetch(directionsUrl);
                    const directionsData = await directionsResponse.json();

                    if (directionsData.status === 'OK' && directionsData.routes.length > 0) {
                        const durationMinutes = Math.round(directionsData.routes[0].legs[0].duration.value / 60);
                        venue.participantTimes[participant.id] = durationMinutes;
                        times.push(durationMinutes);
                    } else {
                        console.warn(`Directions failed for ${participant.name} to ${venue.name}`);
                        venue.participantTimes[participant.id] = 999; // fallback
                        times.push(999);
                    }
                } catch (error) {
                    console.error('Directions API error:', error);
                    venue.participantTimes[participant.id] = 999;
                    times.push(999);
                }
            }

            // Calculate metrics
            venue.averageTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
            venue.maxTime = Math.max(...times);

            venuesWithTimes.push(venue);
        }

        // Step 4: Sort by average time (Balanced approach)
        venuesWithTimes.sort((a, b) => a.averageTime - b.averageTime);

        // Return top 5
        const topVenues = venuesWithTimes.slice(0, 5);

        return NextResponse.json({
            success: true,
            venues: topVenues,
            center: { lat: centerLat, lng: centerLng }
        });

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}