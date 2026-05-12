// scripts/build-cities-db.mjs
// Run: node scripts/build-cities-db.mjs
// Or:  npm run build-db

import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'

const CSV_PATH = join(process.cwd(), 'data', 'worldcities.csv')
const DB_PATH = join(process.cwd(), 'data', 'cities.db')

const csv = readFileSync(CSV_PATH, 'utf-8')
const lines = csv.split('\n')
const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

// Map header names to column indices
const col = (name) => headers.indexOf(name)

const db = new Database(DB_PATH)

db.exec(`
  DROP TABLE IF EXISTS cities;
  CREATE TABLE cities (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    city_ascii TEXT NOT NULL,
    country    TEXT NOT NULL,
    region     TEXT NOT NULL,
    lat        REAL NOT NULL,
    lon        REAL NOT NULL,
    timezone   TEXT NOT NULL DEFAULT '',
    population INTEGER NOT NULL DEFAULT 0
  );
`)

const insert = db.prepare(`
  INSERT INTO cities (id, name, city_ascii, country, region, lat, lon, timezone, population)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertAll = db.transaction((rows) => {
  for (const row of rows) insert.run(...row)
})

const rows = []
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) continue

  // Quote-aware CSV split: handles fields wrapped in double-quotes
  const fields = []
  let current = ''
  let inQuote = false
  for (let ci = 0; ci < line.length; ci++) {
    const ch = line[ci]
    if (ch === '"') {
      inQuote = !inQuote
    } else if (ch === ',' && !inQuote) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)

  const id = parseInt(fields[col('id')], 10)
  const name = fields[col('city')] || ''
  const city_ascii = fields[col('city_ascii')] || ''
  const country = fields[col('country')] || ''
  const region = fields[col('admin_name')] || ''
  const lat = parseFloat(fields[col('lat')]) || 0
  const lon = parseFloat(fields[col('lng')]) || 0
  const timezone = ''  // Simplemaps Basic does not include timezone — use empty string
  const population = parseInt(fields[col('population')], 10) || 0

  if (!id || !name) continue
  rows.push([id, name, city_ascii, country, region, lat, lon, timezone, population])
}

insertAll(rows)
db.close()

console.log(`Built cities.db: ${rows.length} cities inserted at ${DB_PATH}`)
