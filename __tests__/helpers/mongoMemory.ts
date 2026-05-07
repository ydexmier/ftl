/**
 * In this sandbox environment, mongodb-memory-server cannot download MongoDB binaries
 * (network policy blocks fastdl.mongodb.org). These functions are kept as stubs for
 * API compatibility. The tests use jest.spyOn() on Mongoose model methods instead.
 */

export async function startMemoryMongo() {
  // no-op: model methods are mocked via jest.spyOn() in each test file
}

export async function stopMemoryMongo() {
  // no-op
}

export async function clearCollections() {
  // no-op
}
