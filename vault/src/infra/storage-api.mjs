// Implement DynamoDB or Secrets Manager here

export class StorageAPI {
  constructor () {
    this.storageClient = new Map()
  }

  async save({ key, value }) {
    this.storageClient.set(key, value)
  }

  async load({ key }) {
    return this.storageClient.get(key)
  }
}
