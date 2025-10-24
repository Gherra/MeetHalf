'use client';

import { useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';

type Participant = {
    id: string;
    name: string;
    lat: number | null;
    lng: number | null;
    mode: 'DRIVING' | 'TRANSIT' | 'WALKING';
};

type Venue = {
    placeId: string;
    name: string;
    lat: number;
    lng: number;
};

type MapComponentProps = {
    participants: Participant[];
    venues?: Venue[];
    center?: { lat: number; lng: number };
};

// Auto-zoom & center (participants + venues) with sensible fallbacks
function MapController({
    participants,
    venues = [],
}: {
    participants: Participant[];
    venues?: Venue[];
}) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const pts: Array<{ lat: number; lng: number }> = [
            ...participants
                .filter(p => p.lat != null && p.lng != null)
                .map(p => ({ lat: p.lat as number, lng: p.lng as number })),
            ...venues.map(v => ({ lat: v.lat, lng: v.lng })),
        ];

        // 0 points → default Vancouver
        if (pts.length === 0) {
            map.setCenter({ lat: 49.2827, lng: -123.1207 });
            map.setZoom(12);
            return;
        }

        // 1 point → center + friendly zoom (like your old logic)
        if (pts.length === 1) {
            map.panTo(pts[0]);
            map.setZoom(14);
            return;
        }

        // 2+ points → fit bounds (participants + venues)
        const bounds = new google.maps.LatLngBounds();
        pts.forEach(p => bounds.extend(p));

        // If points are extremely close, expand bounds a touch so fitBounds picks a sane zoom
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        if (ne.equals(sw)) {
            const padDeg = 0.001; // ~100m
            bounds.extend({ lat: ne.lat() + padDeg, lng: ne.lng() + padDeg });
            bounds.extend({ lat: ne.lat() - padDeg, lng: ne.lng() - padDeg });
        }

        const padding: google.maps.Padding = window.innerWidth < 768
            ? { top: 80, right: 80, bottom: 80, left: 80 }
            : { top: 120, right: 150, bottom: 120, left: 150 };

        map.fitBounds(bounds, padding);

        // Clamp extremes after fitBounds decides (prevents over/under-zoom)
        const once = google.maps.event.addListenerOnce(map, 'idle', () => {
            const z = map.getZoom() ?? 12;
            if (z > 17) map.setZoom(17);
            if (z < 6) map.setZoom(6);
        });

        // Re-fit on resize so padding stays nice on mobile/desktop switches
        const onResize = () => map.fitBounds(bounds, padding);
        window.addEventListener('resize', onResize);

        return () => {
            google.maps.event.removeListener(once);
            window.removeEventListener('resize', onResize);
        };
    }, [map, participants, venues]);

    return null;
}


export default function MapComponent({ participants, venues = [] }: MapComponentProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';

    const getPinColor = (mode: string) => {
        switch (mode) {
            case 'DRIVING': return '#3B82F6';
            case 'TRANSIT': return '#10B981';
            case 'WALKING': return '#F59E0B';
            default: return '#6366F1';
        }
    };

    return (
        <APIProvider apiKey={apiKey}>
            <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg">
                <Map
                    defaultCenter={{ lat: 49.2827, lng: -123.1207 }}
                    defaultZoom={12}
                    mapId="meethalf-map"
                    gestureHandling="greedy"
                >
                    <MapController participants={participants} venues={venues} />

                    {participants.map((participant) =>
                        participant.lat && participant.lng ? (
                            <AdvancedMarker
                                key={participant.id}
                                position={{ lat: participant.lat, lng: participant.lng }}
                            >
                                <Pin
                                    background={getPinColor(participant.mode)}
                                    borderColor="#1F2937"
                                    glyphColor="#FFFFFF"
                                >
                                    <div className="text-xs font-bold">
                                        {participant.name.charAt(0).toUpperCase()}
                                    </div>
                                </Pin>
                            </AdvancedMarker>
                        ) : null
                    )}

                    {venues.map((venue, index) => (
                        <AdvancedMarker
                            key={venue.placeId}
                            position={{ lat: venue.lat, lng: venue.lng }}
                        >
                            <Pin
                                background="#DC2626"
                                borderColor="#991B1B"
                                glyphColor="#FFFFFF"
                            >
                                <div className="text-xs font-bold">{index + 1}</div>
                            </Pin>
                        </AdvancedMarker>
                    ))}
                </Map>
            </div>
        </APIProvider>
    );
}