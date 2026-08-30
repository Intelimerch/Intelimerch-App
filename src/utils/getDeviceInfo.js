// src/utils/getDeviceInfo.js
export async function getDeviceInfo() {
    try {
        // Get IP address
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const { ip } = await ipResponse.json();

        // Get latitude & longitude (Promise wrapper - resolves properly)
        const location = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    resolve({ latitude, longitude, accuracy });
                },
                (error) => {
                    console.error("Location error:", error.message);
                    // Resolve with nulls instead of rejecting - don't break the flow
                    resolve({ latitude: null, longitude: null, accuracy: null });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });

        const deviceInfo = {
            ip,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy
        };

        return deviceInfo;
    } catch (error) {
        console.error("Error getting device info:", error);
        // Return fallback with nulls if location is denied
        return {
            ip: null,
            latitude: null,
            longitude: null,
            accuracy: null
        };
    }
}