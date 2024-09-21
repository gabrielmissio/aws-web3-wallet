import { randomUUID } from 'crypto'
import { HDNodeWallet } from 'ethers'

// https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki // HD Wallets
// https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki // Multi-Account HD Wallets
export class WalletService {
  constructor({ walletRepository, vaultApi }) {
    this.walletRepository = walletRepository
    this.vaultApi = vaultApi
  }

  async createWallet ({ description }) {
    const walletId = randomUUID()
    const walletPath = 'm/44\'/60\'/0\'' // TODO: Add support for other coins / multi-account

    // NOTE: vault only
    const { xpub } = await this.vaultApi.createHDWallet({ walletId })
      .then(() => this.vaultApi.exportPublicKeyInfo({ walletId, derivationPath: walletPath }))

    const wallet = await this.walletRepository.createWallet({
      walletId,
      xpub,
      type: 'hd',
      description,
      derivationPath: walletPath,
    })
    return wallet
  }

  async getWalletInfo ({ walletId }) {
    if (typeof walletId !== 'string') {
      throw new Error('walletId must be a string')
    }

    const walletPath = 'm/44\'/60\'/0\'' // TODO: Add support for other coins / multi-account
    const wallet = await this.walletRepository.getWalletInfo(walletId, walletPath)

    if (!wallet) {
      throw new Error('Wallet not found')
    }

    return wallet
  }

  async getAddressInfo ({ address }) {
    if (typeof address !== 'string') {
      throw new Error('address must be a string')
    }

    const node = await this.walletRepository.getAddrressInfo(address)
    if (!node) {
      throw new Error('Address not found')
    }

    return node
  }

  async generateNewAddress ({ walletId, description, accountIndex = 0 }) {
    if (typeof walletId !== 'string') {
      throw new Error('walletId must be a string')
    }
    if (typeof accountIndex !== 'number') {
      throw new Error('accountIndex must be a number')
    }
    if (accountIndex < 0) {
      throw new Error('accountIndex must be greater than or equal to 0')
    }

    const wallet = await this.getWalletInfo({ walletId })

    // TODO: Handle "change" path (0/1)
    // Loading current addressIndex from account (+1)
    const accountDerivationPath = `m/44'/60'/${accountIndex}'`
    const { count: addressIndex } = await this.walletRepository.incrementDerivationCounter({
      walletId,
      derivationPath: accountDerivationPath,
    })

    // m / purpose' / coinType' / account' / change / addressIndex
    const addressDerivationPath = `0/${addressIndex - 1}`
    const fullDerivationPath = `${accountDerivationPath}/${addressDerivationPath}`
    const node = getNodeByXpubAndDp({ xpub: wallet.xpub, derivationPath: addressDerivationPath })

    const newAddress = await this.walletRepository.createAddress({
      walletId,
      description,
      address: node.address,
      derivationPath: fullDerivationPath,
      type: 'hd',
    })
    return newAddress
  }
}

function getNodeByXpubAndDp({ xpub, derivationPath }) {
  const readOnlyMaster = HDNodeWallet.fromExtendedKey(xpub)
  const node = readOnlyMaster.derivePath(derivationPath)

  return {
    address: node.address,
    publicKey: node.publicKey,
    derivationPath,
  }
}
