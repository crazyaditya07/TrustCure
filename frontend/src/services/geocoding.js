/**
 * Geocoding service using OpenStreetMap Nominatim API
 * Free to use, no API key required
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

/**
 * Convert a text address to coordinates
 * @param {string} address - The address to geocode
 * @returns {Promise<{lat: number, lng: number, display_name: string} | null>}
 */
export async function geocodeAddress(address) {
    if (!address || address.trim().length === 0) {
        return null;
    }

    try {
        const params = new URLSearchParams({
            q: address,
            format: 'json',
            limit: '1',
            addressdetails: '1'
        });

        const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
            headers: {
                'User-Agent': 'TrustCure Supply Chain App'
            }
        });

        if (!response.ok) {
            console.error('Geocoding request failed:', response.status);
            return null;
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                display_name: result.display_name,
                city: result.address?.city || result.address?.town || result.address?.village || '',
                country: result.address?.country || ''
            };
        }

        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

/**
 * Reverse geocode coordinates to get address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{address: string, city: string, country: string} | null>}
 */
export async function reverseGeocode(lat, lng) {
    try {
        const params = new URLSearchParams({
            lat: lat.toString(),
            lon: lng.toString(),
            format: 'json',
            addressdetails: '1'
        });

        const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
            headers: {
                'User-Agent': 'TrustCure Supply Chain App'
            }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (data && data.address) {
            return {
                address: data.display_name,
                city: data.address.city || data.address.town || data.address.village || '',
                country: data.address.country || ''
            };
        }

        return null;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
}

export default { geocodeAddress, reverseGeocode };
