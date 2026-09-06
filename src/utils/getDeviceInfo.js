// src/utils/getDeviceInfo.js

export async function getDeviceInfo() {
    try {
        // 1. Try to get IP (don't fail if it doesn't work)
        let ip = null;
        try {
            const ipResponse = await fetch("https://api.ipify.org?format=json");
            const { ip: fetchedIp } = await ipResponse.json();
            ip = fetchedIp;
        } catch (ipErr) {
            console.error("Failed to get IP (using null):", ipErr.message);
        }

        // 2. Get latitude & longitude (may fail if permission denied)
        let latitude = null, longitude = null, accuracy = null;
        try {
            const location = await new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude, accuracy } = position.coords;
                        resolve({ latitude, longitude, accuracy });
                    },
                    (error) => {
                        console.error("Location error:", error.message);
                        resolve({ latitude: null, longitude: null, accuracy: null });
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            });

            latitude = location.latitude;
            longitude = location.longitude;
            accuracy = location.accuracy;
        } catch (locErr) {
            console.error("Location not available:", locErr.message);
        }

        // 3. Try to reverse-geocode (don't fail if it doesn't work)
        let country = "Unknown";
        let state = "Unknown";
        let city = "Unknown";

        if (latitude && longitude) {
            try {
                const geoResponse = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                    { signal: AbortSignal.timeout(5000) } // ✅ 5 second timeout
                );
                const geoData = await geoResponse.json();

                if (geoData.address) {
                    country = geoData.address.country || "Unknown";
                    state = geoData.address.state || geoData.address.region || "Unknown";
                    city = geoData.address.city || geoData.address.town || geoData.address.village || "Unknown";
                }
            } catch (geoErr) {
                console.error("Failed to reverse-geocode (using Unknown):", geoErr.message);
            }
        }

        return {
            ip,
            latitude,
            longitude,
            accuracy,
            country,
            state,
            city,
        };
    } catch (error) {
        console.error("Error getting device info:", error);
        return {
            ip: null,
            latitude: null,
            longitude: null,
            accuracy: null,
            country: "Unknown",
            state: "Unknown",
            city: "Unknown",
        };
    }
}