import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_CONNECTION_STRING

if (!MONGODB_URI) {
  console.warn('MONGODB_CONNECTION_STRING not found, using in-memory mock')
}

interface MongooseConnection {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseConnection | undefined
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectToDatabase() {
  if (!MONGODB_URI) {
    console.log('No MongoDB URI provided, using mock connection')
    return { connection: { readyState: 1 } } // Mock connection
  }

  if (cached!.conn) {
    return cached!.conn
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached!.promise = mongoose.connect(MONGODB_URI, opts)
  }

  try {
    cached!.conn = await cached!.promise
  } catch (e) {
    cached!.promise = null
    console.error('Database connection error:', e)
    throw e
  }

  return cached!.conn
}

export default connectToDatabase 