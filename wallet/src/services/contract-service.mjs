export class ContractService {
  constructor({
    transactionService,
    contractRepository,
    walletRepository,
    vaultApi,
  }) {
    this.transactionService = transactionService
    this.contractRepository = contractRepository
    this.walletRepository = walletRepository
    this.vaultApi = vaultApi
  }

  async createContract({ from, contractId, constructorArgs }) {
    // const contract = await this.contractRepository.getContractInfo(contractId)
    const wallet = await this.walletRepository.getAddrressInfo(from)

    // TODO: check if wallet exists / is valid / etc

    const unsignedTx = await this.transactionService.buildContractDeployTx({
      contractId,
      constructorArgs,
      sender: wallet.address,
    })
    const signedTx = await this.vaultApi.signTransaction({
      walletId: wallet.walletId,
      derivationPath: wallet.derivationPath,
      unsignedTx,
    })

    const txReceipt = await this.transactionService.broadcastTx(signedTx)
    const newContract = await this.contractRepository.createContract({
      contractId,
      contractAddress: txReceipt.contractAddress,
      creator: wallet.address,
      txHash: txReceipt.txHash,
    })

    return { contract: newContract, txReceipt }
  }

  async getContractInfo(contractAddress) {
    return this.contractRepository.getContractInfo(contractAddress)
  }

  async callContract({ contractAddress, contractFuncName, contractFuncArgs }) {
    return this.contractRepository.callContract({ contractAddress, contractFuncName, contractFuncArgs })
  }
}
