function haversineDistance([lon1, lat1], [lon2, lat2]) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function filterParkingSpots(spots, filters = {}) {
  const { onlyAvailable = false } = filters;

  if (!onlyAvailable) {
    return spots;
  }

  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  return spots.filter((spot) => {
    if (spot.isAvailable === false) return false;
    if (!spot.available || !spot.available.includes(' - ')) return true;

    const [start, end] = spot.available.split(' - ');
    const startMinutes = parseTime(start);
    const endMinutes = parseTime(end);
    if (startMinutes === null || endMinutes === null) return true;

    return startMinutes <= endMinutes
      ? currentTime >= startMinutes && currentTime < endMinutes
      : currentTime >= startMinutes || currentTime < endMinutes;
  });
}

function sortParkingSpots(spots, userLocation = null, sortBy = 'price') {
  const list = [...spots];

  if (sortBy === 'distance' && userLocation && userLocation.length === 2) {
    return list.sort((a, b) => {
      const aDistance = haversineDistance(userLocation, getCoordinates(a));
      const bDistance = haversineDistance(userLocation, getCoordinates(b));
      return aDistance - bDistance;
    });
  }

  return list.sort((a, b) => {
    const aValue = Number(a.priceValue ?? a.price ?? 0);
    const bValue = Number(b.priceValue ?? b.price ?? 0);
    return aValue - bValue;
  });
}

function parseTime(value) {
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function getCoordinates(spot) {
  if (Array.isArray(spot.coordinates) && spot.coordinates.length === 2) {
    return spot.coordinates;
  }

  const longitude = Number(spot.longitude);
  const latitude = Number(spot.latitude);
  return Number.isFinite(longitude) && Number.isFinite(latitude)
    ? [longitude, latitude]
    : [0, 0];
}

module.exports = {
  filterParkingSpots,
  sortParkingSpots,
};
