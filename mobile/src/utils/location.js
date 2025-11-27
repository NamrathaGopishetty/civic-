import * as Location from 'expo-location';

export async function getCurrentLocationAsync() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    let address = '';
    try {
      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        address = [
          place.name || place.street,
          place.district,
          place.city || place.subregion,
          place.region,
          place.postalCode,
        ]
          .filter(Boolean)
          .join(', ');
      }
    } catch (geoError) {
      console.warn('Reverse geocode failed', geoError);
    }

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      address,
    };
  } catch (err) {
    console.warn('Location error', err);
    return null;
  }
}
