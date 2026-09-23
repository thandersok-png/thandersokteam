const test = require('node:test');
const assert = require('node:assert/strict');

const {
  filterParkingSpots,
  sortParkingSpots,
} = require('../utils/parkingFilters');

test('filterParkingSpots keeps only available parking spots when requested', () => {
  const spots = [
    { id: '1', isAvailable: true },
    { id: '2', isAvailable: false },
    { id: '3', isAvailable: true },
  ];

  const result = filterParkingSpots(spots, { onlyAvailable: true });
  assert.deepEqual(result.map((spot) => spot.id), ['1', '3']);
});

test('sortParkingSpots orders by lowest price by default', () => {
  const spots = [
    { id: '1', price: 2.5 },
    { id: '2', price: 1.2 },
    { id: '3', price: 1.9 },
  ];

  const result = sortParkingSpots(spots, null, 'price');
  assert.deepEqual(result.map((spot) => spot.id), ['2', '3', '1']);
});

test('sortParkingSpots orders by nearest distance when user location is provided', () => {
  const spots = [
    { id: 'a', coordinates: [22.9444, 40.6401] },
    { id: 'b', coordinates: [22.9346, 40.6325] },
    { id: 'c', coordinates: [22.9519, 40.6361] },
  ];

  const result = sortParkingSpots(spots, [22.9400, 40.6350], 'distance');
  assert.deepEqual(result.map((spot) => spot.id), ['b', 'a', 'c']);
});
