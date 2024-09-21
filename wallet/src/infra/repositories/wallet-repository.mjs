/* eslint-disable no-unused-vars */
export class WalletRepository {
  constructor() {
  }

  async createWallet(data) {}

  async getWalletInfo(walletId) {}

  async generateAddress(walletId) {}

  async getAddrressInfo(address) {
    return {
      address,
      walletId: '1',
      derivationPath: 'm/44\'/60\'/0\'/0/0',
    }
  }
}
