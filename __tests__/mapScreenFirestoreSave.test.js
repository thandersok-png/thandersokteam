const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

test('MapScreen should use Firestore serverTimestamp and close add modal after a successful save', () => {
  const mapScreenSource = fs.readFileSync(
    path.join(__dirname, '..', 'screens', 'MapScreen.js'),
    'utf8'
  );

  assert.match(mapScreenSource, /serverTimestamp/);
  assert.match(mapScreenSource, /setShowAddModal\(false\)/);
  assert.match(mapScreenSource, /setSelectedCoordinates\(null\)/);
});
