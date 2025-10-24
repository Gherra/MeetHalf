'use client';

import { useState, useEffect, useRef } from 'react';
import MapComponent from '../components/Map';

type TravelMode = 'DRIVING' | 'TRANSIT' | 'WALKING';

type Participant = {
    id: string;
    name: string;
    address: string;
    lat: number | null;
    lng: number | null;
    mode: TravelMode;
};

type Venue = {
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

export default function MeetingPage() {
    const [meetingTitle, setMeetingTitle] = useState('');
    const [venueType, setVenueType] = useState('cafe');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [loading, setLoading] = useState(false);

    const [newName, setNewName] = useState('');
    const [newAddress, setNewAddress] = useState('');
    const [newMode, setNewMode] = useState<TravelMode>('DRIVING');

    const addressInputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        const initAutocomplete = () => {
            if (!addressInputRef.current || autocompleteRef.current) return;

            if (window.google?.maps?.places) {
                autocompleteRef.current = new window.google.maps.places.Autocomplete(
                    addressInputRef.current,
                    {
                        componentRestrictions: { country: 'ca' },
                        fields: ['formatted_address', 'geometry', 'name'],
                    }
                );

                autocompleteRef.current.addListener('place_changed', () => {
                    const place = autocompleteRef.current?.getPlace();
                    if (place?.formatted_address) {
                        setNewAddress(place.formatted_address);
                    }
                });
            }
        };

        const timer = setTimeout(initAutocomplete, 1000);
        return () => clearTimeout(timer);
    }, []);

    const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
        try {
            const geocoder = new google.maps.Geocoder();
            const result = await geocoder.geocode({ address });

            if (result.results[0]) {
                const location = result.results[0].geometry.location;
                return {
                    lat: location.lat(),
                    lng: location.lng(),
                };
            }
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    };

    const addParticipant = async () => {
        if (!newName || !newAddress) {
            alert('Please enter both name and address');
            return;
        }

        const coords = await geocodeAddress(newAddress);

        if (!coords) {
            alert('Could not find that address. Please try again.');
            return;
        }

        const newParticipant: Participant = {
            id: Date.now().toString(),
            name: newName,
            address: newAddress,
            lat: coords.lat,
            lng: coords.lng,
            mode: newMode,
        };

        setParticipants([...participants, newParticipant]);

        setNewName('');
        setNewAddress('');
        setNewMode('DRIVING');
    };

    const removeParticipant = (id: string) => {
        setParticipants(participants.filter(p => p.id !== id));
    };

    const findPlaces = async () => {
        if (participants.length < 2) {
            alert('Add at least 2 participants!');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/find-places', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participants: participants.map(p => ({
                        id: p.id,
                        name: p.name,
                        lat: p.lat,
                        lng: p.lng,
                        mode: p.mode,
                    })),
                    venueType: venueType,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setVenues(data.venues);
                console.log('Found venues:', data.venues);
            } else {
                alert('Failed to find places: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error finding places:', error);
            alert('Error finding places. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    const getModeIcon = (mode: TravelMode) => {
        switch (mode) {
            case 'DRIVING': return '🚗';
            case 'TRANSIT': return '🚇';
            case 'WALKING': return '🚶';
        }
    };

    const getModeColor = (mode: TravelMode) => {
        switch (mode) {
            case 'DRIVING': return 'bg-blue-100 text-blue-800';
            case 'TRANSIT': return 'bg-green-100 text-green-800';
            case 'WALKING': return 'bg-orange-100 text-orange-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-800">MeetHalf 🎯</h1>
                    <a href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        ← Back to Home
                    </a>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Meeting Details</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Meeting Title
                                    </label>
                                    <input
                                        type="text"
                                        value={meetingTitle}
                                        onChange={(e) => setMeetingTitle(e.target.value)}
                                        placeholder="e.g., Study Session"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Venue Type
                                    </label>
                                    <select
                                        value={venueType}
                                        onChange={(e) => setVenueType(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="cafe">Café</option>
                                        <option value="restaurant">Restaurant</option>
                                        <option value="library">Library</option>
                                        <option value="park">Park</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Add Participants</h2>

                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />

                                <input
                                    ref={addressInputRef}
                                    type="text"
                                    value={newAddress}
                                    onChange={(e) => setNewAddress(e.target.value)}
                                    placeholder="Start typing address..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />

                                <select
                                    value={newMode}
                                    onChange={(e) => setNewMode(e.target.value as TravelMode)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="DRIVING">🚗 Driving</option>
                                    <option value="TRANSIT">🚇 Transit</option>
                                    <option value="WALKING">🚶 Walking</option>
                                </select>
                            </div>

                            <button
                                onClick={addParticipant}
                                className="mt-4 w-full bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                            >
                                Add Participant
                            </button>

                            {participants.length > 0 && (
                                <div className="mt-6 space-y-2">
                                    <h3 className="font-medium text-gray-700">Participants ({participants.length})</h3>
                                    {participants.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {p.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-800">{p.name}</p>
                                                    <p className="text-sm text-gray-500">{p.address}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getModeColor(p.mode)}`}>
                                                    {getModeIcon(p.mode)} {p.mode}
                                                </span>
                                                <button
                                                    onClick={() => removeParticipant(p.id)}
                                                    className="text-red-500 hover:text-red-700 font-medium"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {participants.length >= 2 && (
                            <div className="text-center">
                                <button
                                    onClick={findPlaces}
                                    disabled={loading}
                                    className="w-full bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {loading ? '🔍 Finding Places...' : '🎯 Find Best Places'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Map</h2>
                            <MapComponent participants={participants} venues={venues} />
                            {participants.length === 0 && (
                                <p className="text-center text-gray-500 mt-4">
                                    Add participants to see them on the map
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {venues.length > 0 && (
                    <div className="mt-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-2xl font-bold mb-2">🎯 Best Meeting Spots</h2>
                            <p className="text-gray-600 mb-6">
                                Sorted by average travel time (fastest for everyone)
                            </p>

                            <div className="space-y-4">
                                {venues.map((venue, index) => {
                                    const timeValues = Object.values(venue.participantTimes).filter(t => t < 999);
                                    const minTime = timeValues.length > 0 ? Math.min(...timeValues) : 0;
                                    const isFair = venue.maxTime - minTime <= 5;

                                    return (
                                        <div
                                            key={venue.placeId}
                                            className="border border-gray-200 rounded-lg p-5 hover:border-indigo-300 hover:shadow-md transition"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-gray-800">
                                                            {venue.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">{venue.address}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {venue.rating > 0 && (
                                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium">
                                                            ⭐ {venue.rating.toFixed(1)}
                                                        </span>
                                                    )}
                                                    {venue.priceLevel > 0 && (
                                                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm font-medium">
                                                            {'$'.repeat(venue.priceLevel)}
                                                        </span>
                                                    )}
                                                    {venue.openNow && (
                                                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                                                            Open Now
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                                {participants.map((p) => {
                                                    const time = venue.participantTimes[p.id];
                                                    const isLongest = time === venue.maxTime;

                                                    return (
                                                        <div
                                                            key={p.id}
                                                            className={isLongest ? 'flex items-center gap-2 p-2 rounded bg-orange-50 border border-orange-200' : 'flex items-center gap-2 p-2 rounded bg-gray-50'}
                                                        >
                                                            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                                                {p.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs text-gray-600 truncate">{p.name}</p>
                                                                <p className="text-sm font-bold text-gray-800">
                                                                    {time < 999 ? `${time} min` : 'N/A'} {getModeIcon(p.mode)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">Avg:</span>
                                                    <span className="font-bold text-indigo-600">{venue.averageTime} min</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-gray-600">Max:</span>
                                                    <span className="font-bold text-orange-600">{venue.maxTime} min</span>
                                                </div>
                                                {isFair && (
                                                    <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                                                        ✨ Most Fair
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-3">
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}&query_place_id=${venue.placeId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                                                >
                                                    Open in Google Maps →
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}