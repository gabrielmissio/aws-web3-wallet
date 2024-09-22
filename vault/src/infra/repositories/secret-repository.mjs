import {
  GetCommand,
  PutCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

export class SecretRepository {
  constructor() {
    this.tableName = process.env.SECRETS_TABLE_NAME
    this.client = new DynamoDBClient({ region: process.env.AWS_REGION })
    this.docClient = DynamoDBDocumentClient.from(this.client)
  }

  async createSecret({ secretId, ...data }) {
    const putCommand = new PutCommand({
      TableName: this.tableName,
      Item: {
        ...data,
        secretId,
      },
    })

    await this.docClient.send(putCommand)

    return {
      secretId,
      ...data,
    }
  }

  async getSecret(secretId) {
    const getCommand = new GetCommand({
      TableName: this.tableName,
      Key: { secretId },
    })

    const result = await this.docClient.send(getCommand)
    if (!result.Item) {
      return null
    }

    return result.Item
  }
}
