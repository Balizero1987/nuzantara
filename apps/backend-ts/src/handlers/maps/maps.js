import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { forwardToBridgeIfSupported } from "../../services/bridgeProxy.js";
// Google Maps API doesn't use OAuth2 like other Google services
// It uses API Key authentication
async function getMapsClient() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        throw new BadRequestError('Google Maps API key not configured');
    }
    // Using REST API directly since Google Maps uses different auth
    return {
        apiKey,
        baseUrl: 'https://maps.googleapis.com/maps/api'
    };
}
export async function mapsDirections(params) {
    const { origin, destination, mode = 'driving', language = 'en', region = 'ID' } = params || {};
    if (!origin || !destination) {
        throw new BadRequestError('Both origin and destination are required');
    }
    try {
        const { apiKey, baseUrl } = await getMapsClient();
        const url = `${baseUrl}/directions/json?` + new URLSearchParams({
            origin,
            destination,
            mode,
            language,
            region,
            key: apiKey
        });
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'OK' && data.routes.length > 0) {
            const route = data.routes[0];
            const leg = route.legs[0];
            return ok({
                route: {
                    distance: leg.distance.text,
                    duration: leg.duration.text,
                    distanceValue: leg.distance.value, // meters
                    durationValue: leg.duration.value, // seconds
                    startAddress: leg.start_address,
                    endAddress: leg.end_address,
                    steps: leg.steps.map((step) => ({
                        instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML
                        distance: step.distance.text,
                        duration: step.duration.text
                    })),
                    overview: route.summary
                },
                origin,
                destination,
                mode
            });
        }
        else {
            throw new BadRequestError(`Directions not found: ${data.status} - ${data.error_message || 'Unknown error'}`);
        }
    }
    catch (error) {
        // Fallback to Bridge legacy implementation
        const bridged = await forwardToBridgeIfSupported('maps.directions', params);
        if (bridged)
            return bridged;
        throw new BadRequestError(`Maps directions failed: ${error.message}`);
    }
}
export async function mapsPlaces(params) {
    const { query, location, radius = 5000, type, language = 'en', region = 'ID', pageSize = 20 } = params || {};
    if (!query && !location) {
        throw new BadRequestError('Either query or location is required');
    }
    try {
        const { apiKey, baseUrl } = await getMapsClient();
        let url;
        let searchParams = {
            language,
            region,
            key: apiKey
        };
        if (query) {
            // Text search
            url = `${baseUrl}/place/textsearch/json`;
            searchParams.query = query;
            if (location) {
                searchParams.location = location;
                searchParams.radius = radius;
            }
        }
        else {
            // Nearby search (requires location)
            url = `${baseUrl}/place/nearbysearch/json`;
            searchParams.location = location;
            searchParams.radius = radius;
            if (type) {
                searchParams.type = type;
            }
        }
        const response = await fetch(url + '?' + new URLSearchParams(searchParams));
        const data = await response.json();
        if (data.status === 'OK') {
            const places = data.results.slice(0, pageSize).map((place) => ({
                name: place.name,
                placeId: place.place_id,
                address: place.formatted_address || place.vicinity,
                location: {
                    lat: place.geometry.location.lat,
                    lng: place.geometry.location.lng
                },
                rating: place.rating || null,
                priceLevel: place.price_level || null,
                types: place.types || [],
                openNow: place.opening_hours?.open_now || null,
                photos: place.photos?.length > 0 ? place.photos.map((photo) => ({
                    reference: photo.photo_reference,
                    width: photo.width,
                    height: photo.height
                })) : []
            }));
            return ok({
                places,
                totalResults: places.length,
                query,
                location,
                searchType: query ? 'text' : 'nearby'
            });
        }
        else {
            throw new BadRequestError(`Places search failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
        }
    }
    catch (error) {
        // Fallback to Bridge legacy implementation
        const bridged = await forwardToBridgeIfSupported('maps.places', params);
        if (bridged)
            return bridged;
        throw new BadRequestError(`Maps places search failed: ${error.message}`);
    }
}
export async function mapsPlaceDetails(params) {
    const { placeId, fields = 'formatted_address,name,rating,formatted_phone_number,website,opening_hours' } = params || {};
    if (!placeId) {
        throw new BadRequestError('placeId is required');
    }
    try {
        const { apiKey, baseUrl } = await getMapsClient();
        const url = `${baseUrl}/place/details/json?` + new URLSearchParams({
            place_id: placeId,
            fields,
            language: 'en',
            key: apiKey
        });
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === 'OK') {
            const place = data.result;
            return ok({
                place: {
                    name: place.name,
                    placeId: place.place_id,
                    address: place.formatted_address,
                    phone: place.formatted_phone_number || null,
                    website: place.website || null,
                    rating: place.rating || null,
                    location: place.geometry ? {
                        lat: place.geometry.location.lat,
                        lng: place.geometry.location.lng
                    } : null,
                    openingHours: place.opening_hours ? {
                        openNow: place.opening_hours.open_now,
                        weekdayText: place.opening_hours.weekday_text || []
                    } : null
                }
            });
        }
        else {
            throw new BadRequestError(`Place details not found: ${data.status} - ${data.error_message || 'Unknown error'}`);
        }
    }
    catch (error) {
        // Fallback to Bridge legacy implementation
        const bridged = await forwardToBridgeIfSupported('maps.placeDetails', params);
        if (bridged)
            return bridged;
        throw new BadRequestError(`Maps place details failed: ${error.message}`);
    }
}
