import { HDNodeWallet, Transaction } from 'ethers'

export class SignTransaction {
  constructor({ kmsApi, storageApi }) {
    this.kmsApi = kmsApi
    this.storageApi = storageApi
  }

  async execute({ walletId, unsignedTx, derivationPath } = {}) {
    const wallet = await this.storageApi.load({ key: walletId })
    if (!wallet) throw new Error('Wallet not found')

    const masterNode = HDNodeWallet.fromExtendedKey(wallet.xprv)
    const node = masterNode.derivePath(derivationPath)

    const parsedUnsignedTx = Transaction.from(unsignedTx)
    // unsignedTx = {
    //   chainId: transaction.chainId,
    //   nonce: transaction.nonce,
    //   gasLimit: transaction.gasLimit,
    //   gasPrice: transaction.gasPrice,
    //   maxFeePerGas: transaction.maxFeePerGas,
    //   maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
    //   to: transaction.to,
    //   value: transaction.value,
    //   data: transaction.data,
    //   type: transaction.type,
    //   accessList: transaction.accessList,
    // }

    const signedTx = await node.signTransaction(parsedUnsignedTx)

    return { signedTx }
  }
}
