import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

export class WalletRepository {
  constructor() {
    this.tableName = process.env.ADDRESSES_TABLE_NAME
    this.client = new DynamoDBClient({ region: process.env.AWS_REGION })
    this.docClient = DynamoDBDocumentClient.from(this.client)
  }

  async createWallet({ walletId, derivationPath, ...data }) {
    const putCommand = new PutCommand({
      TableName: this.tableName,
      Item: {
        ...data,
        PK: walletId,
        SK: derivationPath,
      },
    })

    await this.docClient.send(putCommand)

    return {
      walletId,
      derivationPath,
      ...data,
    }
  }

  async getWalletInfo(walletId, derivationPath) {
    const getCommand = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: walletId,
        SK: derivationPath,
      },
    })

    const result = await this.docClient.send(getCommand)
    if (!result.Item) {
      return null
    }

    // eslint-disable-next-line no-unused-vars
    const { PK, SK, ...data } = result.Item
    return {
      walletId,
      derivationPath,
      ...data,
    }
  }

  async createAddress({ walletId, derivationPath, ...data }) {
    const putCommand = new PutCommand({
      TableName: this.tableName,
      Item: {
        ...data,
        PK: walletId,
        SK: derivationPath,
      },
    })

    await this.docClient.send(putCommand)

    return {
      walletId,
      derivationPath,
      ...data,
    }
  }

  async getAddrressInfo(address) {
    const queryCommand = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'address-index',
      KeyConditionExpression: 'address = :address',
      ExpressionAttributeValues: {
        ':address': address,
      },
    })

    const result = await this.docClient.send(queryCommand)
    if (result.Items.length < 1) {
      return null
    }

    const { SK, PK, ...data } = result.Items[0]

    return {
      walletId: PK,
      derivationPath: SK,
      ...data,
    }
    // return {
    //   address,
    //   walletId: '1',
    //   derivationPath: 'm/44\'/60\'/0\'/0/0',
    // }
  }

  async incrementDerivationCounter({ walletId, derivationPath }) {
    // create a new item if it doesn't exist
    const updateCommand = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: walletId,
        SK: derivationPath,
      },
      UpdateExpression: 'SET #count = if_not_exists(#count, :start) + :inc',
      ExpressionAttributeNames: {
        '#count': 'count',
      },
      ExpressionAttributeValues: {
        ':start': 0,
        ':inc': 1,
      },
      ReturnValues: 'ALL_NEW',
    })

    const result = await this.docClient.send(updateCommand)
    return result.Attributes
  }
}
