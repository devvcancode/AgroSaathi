import { MongoClient } from 'mongodb'
import { createSupabaseDb, getSupabaseServerClient } from '@/backend/supabase'

const runtimeStore = globalThis
let mongoClient = runtimeStore.__agrovaniMongoClient || null
let mongoDb = runtimeStore.__agrovaniMongoDb || null
let memoryDb = runtimeStore.__agrovaniMemoryDb || null
let supabaseDb = runtimeStore.__agrovaniSupabaseDb || null

function createMemoryCollection(initialRows = []) {
  const rows = [...initialRows]
  const makeQueryMatcher = (query = {}) => (row) => Object.entries(query).every(([key, value]) => {
    if (value === undefined) return true
    if (value && typeof value === 'object' && Array.isArray(value.$in)) return value.$in.includes(row[key])
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.entries(value).every(([nestedKey, nestedValue]) => row[key]?.[nestedKey] === nestedValue)
    }
    return row[key] === value
  })

  return {
    async countDocuments() { return rows.length },
    async insertMany(items) { rows.push(...items); return { insertedCount: items.length } },
    async insertOne(item) { rows.push(item); return { insertedId: item.id || rows.length } },
    async updateOne(query, update) {
      const row = rows.find(makeQueryMatcher(query))
      if (!row) return { matchedCount: 0, modifiedCount: 0 }
      Object.assign(row, update.$set || update)
      return { matchedCount: 1, modifiedCount: 1 }
    },
    find(query = {}) {
      const filtered = rows.filter(makeQueryMatcher(query))
      let sortSpec = null
      let limitValue = null
      return {
        sort(spec) { sortSpec = spec; return this },
        limit(value) { limitValue = value; return this },
        async toArray() {
          let result = [...filtered]
          if (sortSpec) {
            result.sort((left, right) => {
              for (const [key, direction] of Object.entries(sortSpec)) {
                if (left[key] === right[key]) continue
                const delta = left[key] > right[key] ? 1 : -1
                return direction === -1 ? -delta : delta
              }
              return 0
            })
          }
          return limitValue === null ? result : result.slice(0, limitValue)
        },
      }
    },
    async findOne(query = {}) { return rows.find(makeQueryMatcher(query)) || null },
  }
}

function createMemoryDb() {
  const collections = {}
  return {
    collection(name) {
      if (!collections[name]) collections[name] = createMemoryCollection()
      return collections[name]
    },
  }
}

async function connectToMongo() {
  if (memoryDb) return memoryDb
  if (!process.env.MONGO_URL || !process.env.DB_NAME) {
    memoryDb = createMemoryDb()
    runtimeStore.__agrovaniMemoryDb = memoryDb
    return memoryDb
  }

  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(process.env.MONGO_URL, { serverSelectionTimeoutMS: 3000, connectTimeoutMS: 3000 })
      await mongoClient.connect()
      mongoDb = mongoClient.db(process.env.DB_NAME)
    }
    if (mongoDb) return mongoDb
    throw new Error('MongoDB connection did not return a database')
  } catch (error) {
    console.warn('MongoDB unavailable, falling back to in-memory store:', error.message)
    mongoClient = null
    memoryDb = createMemoryDb()
    runtimeStore.__agrovaniMongoClient = null
    runtimeStore.__agrovaniMemoryDb = memoryDb
    return memoryDb
  }
}

export function connectToDatabase() {
  if (supabaseDb) return supabaseDb
  const supabase = getSupabaseServerClient()
  if (supabase) {
    supabaseDb = createSupabaseDb(supabase)
    runtimeStore.__agrovaniSupabaseDb = supabaseDb
    return supabaseDb
  }
  return connectToMongo()
}