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

  async createContract({ from, artifactName, constructorArgs }) {
    // const contract = await this.contractRepository.getContractInfo(contractId)
    const wallet = await this.walletRepository.getAddrressInfo(from)

    // TODO: check if wallet exists / is valid / etc

    const unsignedTx = await this.transactionService.buildContractDeployTx({
      artifactName,
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
      artifactName,
      contractAddress: txReceipt.contractAddress,
      creator: wallet.address,
      txHash: txReceipt.txHash,
    })

    return { contract: newContract, txReceipt }
  }

  async getContractInfo(contractAddress) {
    return this.contractRepository.getContractInfo(contractAddress)
  }

  async callContract({ contractAddress, artifactName, contractFuncName, contractFuncArgs }) {
    const response = await this.transactionService.readOnlyContractCall({
      artifactName,
      contractAddress,
      contractFuncName,
      contractFuncArgs,
    })

    return serializeData(response)
  }

  async callContractTx({ from, artifactName, contractAddress, contractFuncName, contractFuncArgs }) {
    // const contract = await this.contractRepository.getContractInfo(contractId)
    const wallet = await this.walletRepository.getAddrressInfo(from)

    // TODO: check if wallet exists / is valid / etc

    const unsignedTx = await this.transactionService.buildContractCallTx({
      sender: from,
      artifactName,
      contractAddress,
      contractFuncName,
      contractFuncArgs,
    })
    const signedTx = await this.vaultApi.signTransaction({
      walletId: wallet.walletId,
      derivationPath: wallet.derivationPath,
      unsignedTx,
    })

    const txReceipt = await this.transactionService.broadcastTx(signedTx)

    return { txReceipt }
  }
}

function serializeData(data) {
  if (data == null) {
    return data
  }

  // Handle BigInt
  if (typeof data === 'bigint') {
    return data.toString()
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item))
  }

  // Handle objects
  if (typeof data === 'object') {
    // Handle other specific types if necessary
    // For example, buffers, hex strings, etc.

    // Recursively serialize object properties
    const serializedObject = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        serializedObject[key] = serializeData(data[key])
      }
    }
    return serializedObject
  }

  // For primitive types (number, string, boolean)
  return data
}
