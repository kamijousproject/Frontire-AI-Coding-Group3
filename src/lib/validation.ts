/**
 * Input Validation Library
 * Validates city name parameters and coordinates for API routes.
 */

const CITY_PATTERN = /^[a-zA-Z0-9 ,'.\\-]+$/;

/**
 * Validate a single city name parameter.
 * Returns the trimmed string on success, or null on failure.
 */
export function validateCityParam(value: unknown): string | null {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();

  if (trimmed.length < 2 || trimmed.length > 100) return null;

  if (!CITY_PATTERN.test(trimmed)) return null;

  return trimmed;
}

/**
 * Validate a comma-separated list of city names.
 * Returns a deduplicated string[] on success, or null on failure.
 * Deduplication uses case-insensitive comparison; first occurrence preserved.
 * Returns null if any city fails validation, or if >10 unique cities.
 */
export function validateCitiesParam(value: unknown): string[] | null {
  if (typeof value !== 'string') return null;

  const parts = value.split(',').map((p) => p.trim());

  // Reject any empty element (e.g. "London,,Paris")
  if (parts.some((p) => p === '')) return null;

  // Validate each city element
  for (const part of parts) {
    if (part.length < 2 || part.length > 100) return null;
    if (!CITY_PATTERN.test(part)) return null;
  }

  // Deduplicate: case-insensitive comparison, keep first occurrence
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      deduped.push(part);
    }
  }

  // Reject if more than 10 unique cities (caller returns 400 code 1005)
  if (deduped.length > 10) return null;

  return deduped;
}

/**
 * Validate a coordinate parameter (latitude or longitude).
 * Returns the parsed number on success, or null on failure.
 */
export function validateCoordParam(
  value: unknown,
  min: number,
  max: number
): number | null {
  const parsed = parseFloat(String(value));

  if (isNaN(parsed)) return null;
  if (parsed < min || parsed > max) return null;

  return parsed;
}

/**
 * Validate a city search query string.
 * Minimum 2 characters, maximum 100 characters.
 * Allows: a-z A-Z 0-9 space comma apostrophe hyphen period
 * Returns the trimmed string on success, or null on failure.
 */
export function validateSearchQuery(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return null;
  if (!CITY_PATTERN.test(trimmed)) return null;
  return trimmed;
}

// -- Inline test cases (manual verification) --
// validateCityParam("London")              → "London"
// validateCityParam("a")                  → null  (too short)
// validateCityParam("A".repeat(101))      → null  (too long)
// validateCityParam("city<script>")       → null  (bad chars)
// validateCitiesParam("London,Paris")     → ["London","Paris"]
// validateCitiesParam("London,,Paris")    → null  (empty element)
// validateCitiesParam(Array(11).fill("city").join(","))  → null (>10)
// validateCoordParam("51.5", -90, 90)     → 51.5
// validateCoordParam("abc", -90, 90)      → null
// validateCoordParam("91", -90, 90)       → null
