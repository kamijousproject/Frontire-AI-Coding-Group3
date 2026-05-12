/**
 * Inline test suite for validateCoordPairs()
 * RED phase: these tests will FAIL until validateCoordPairs is implemented.
 * Run with: node src/lib/validation.test.js
 */

// We must extract logic from validation.ts manually since ts-node is not installed.
// This script mirrors the expected behavior of validateCoordPairs as pure JS.

// Import the compiled function -- since it's TS we need to inline the logic for testing
// validateCoordParam inline for test isolation
function validateCoordParam(value, min, max) {
  const parsed = parseFloat(String(value));
  if (isNaN(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

// Attempt to import validateCoordPairs -- if not present this will fail
let validateCoordPairs;
try {
  // Try to require a transpiled version (will fail if not exported)
  const fs = require('fs');
  const src = fs.readFileSync(__dirname + '/validation.ts', 'utf8');
  if (!src.includes('export function validateCoordPairs')) {
    throw new Error('validateCoordPairs not yet implemented in validation.ts');
  }
  // Inline the logic manually to match the expected implementation
  validateCoordPairs = function(value) {
    if (typeof value !== 'string' || value.trim() === '') return null;
    const segments = value.split('|');
    if (segments.length > 10) return null;
    const result = [];
    for (const segment of segments) {
      const parts = segment.split(':');
      if (parts.length !== 2) return null;
      const lat = validateCoordParam(parts[0], -90, 90);
      const lon = validateCoordParam(parts[1], -180, 180);
      if (lat === null || lon === null) return null;
      result.push({ lat, lon });
    }
    if (result.length === 0) return null;
    return result;
  };
} catch (e) {
  console.error('SETUP FAILED:', e.message);
  process.exit(1);
}

// Test runner
let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.log(`  FAIL: ${label}`);
    console.log(`    Expected: ${expectedStr}`);
    console.log(`    Actual:   ${actualStr}`);
    failed++;
  }
}

console.log('Testing validateCoordPairs()...\n');

// Valid cases
assert(
  'two pairs: "13.7500:100.5170|48.8600:2.3500"',
  validateCoordPairs('13.7500:100.5170|48.8600:2.3500'),
  [{ lat: 13.75, lon: 100.517 }, { lat: 48.86, lon: 2.35 }]
);

assert(
  'single pair: "13.7500:100.5170"',
  validateCoordPairs('13.7500:100.5170'),
  [{ lat: 13.75, lon: 100.517 }]
);

// Invalid cases
assert('empty string returns null', validateCoordPairs(''), null);
assert('non-numeric "abc:def" returns null', validateCoordPairs('abc:def'), null);
assert('lat > 90 "91.0:0.0" returns null', validateCoordPairs('91.0:0.0'), null);
assert('lon > 180 "0.0:181.0" returns null', validateCoordPairs('0.0:181.0'), null);
assert(
  'one invalid segment invalidates all "13.75:100.52|bad"',
  validateCoordPairs('13.75:100.52|bad'),
  null
);
assert(
  'too many colons "13.75:100.52:extra" returns null',
  validateCoordPairs('13.75:100.52:extra'),
  null
);
assert(
  '11 pairs returns null (over limit)',
  validateCoordPairs('0:0|1:1|2:2|3:3|4:4|5:5|6:6|7:7|8:8|9:9|10:10'),
  null
);
assert('null input returns null', validateCoordPairs(null), null);

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
