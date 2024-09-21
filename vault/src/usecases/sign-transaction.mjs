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
    const signedTx = await node.signTransaction(parsedUnsignedTx)

    return { signedTx }
  }
}
