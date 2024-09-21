import express from 'express'
import { JsonRpcProvider } from 'ethers'
import { VaultApi } from './infra/apis/vault-api.mjs'
import { ContractRepository } from './infra/repositories/contract-repository.mjs'
import { WalletRepository } from './infra/repositories/wallet-repository.mjs'
import { TransactionService } from './services/transaction-service.mjs'
import { ContractService } from './services/contract-service.mjs'
import { ContractHelper } from './utils/contract-helper.mjs'

const vaultApi = new VaultApi(process.env.VAULT_API_URL)
const contractRepository = new ContractRepository()
const walletRepository = new WalletRepository()
const provider = new JsonRpcProvider(process.env.RPC_PROVIDER_URL)
const contractHelper = new ContractHelper({ provider })
const transactionService = new TransactionService({ provider, contractHelper })
const contractService = new ContractService({
  transactionService,
  contractRepository,
  walletRepository,
  vaultApi,
})

const app = express()
app.use(express.json())

// TODO: Improve error handling
// TODO: Improve input validation

app.get('/health', (req, res) => {
  res.send('OK')
})

app.post('/wallet', async (req, res) => {
  res.send('Wallet')
})

app.post('/wallet/:walletId/address', async (req, res) => {
  res.send('Wallet address')
})

app.post('/contract', async (req, res) => {
  console.log('Creating contract')
  const { from, contractId, constructorArgs } = req.body

  try {
    const newContract = await contractService.createContract({ from, contractId, constructorArgs })
    return res.status(201).send(newContract)
  } catch (error) {
    console.error(error)
    return res.status(500).send('Error creating contract')
  }
})

app.post('/contract/:contractAddress/call', async (req, res) => {
  res.send('contract call')
})

// app.post('/rpc-provider/sendTransaction', async (req, res) => {
// })

// TODO: Move to a separate file
// function buildDerivationPath({
//   purpose = 44,
//   coinType = 60,
//   account = 0,
//   change = 0,
//   addressIndex = 0,
// } = {}) {
//   return `m/${purpose}'/${coinType}'/${account}'/${change}/${addressIndex}`
// }

export default app
