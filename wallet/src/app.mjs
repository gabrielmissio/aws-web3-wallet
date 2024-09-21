import express from 'express'
import { JsonRpcProvider } from 'ethers'
import { VaultApi } from './infra/apis/vault-api.mjs'
import { ContractRepository } from './infra/repositories/contract-repository.mjs'
import { WalletRepository } from './infra/repositories/wallet-repository.mjs'
import { TransactionService } from './services/transaction-service.mjs'
import { ContractService } from './services/contract-service.mjs'
import { WalletService } from './services/wallet-service.mjs'
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
const walletService = new WalletService({
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
  console.log('Creating HD wallet')
  const { description } = req.body

  try {
    const newWallet = await walletService.createWallet({ description })
    return res.status(201).send(newWallet)
  } catch (error) {
    console.error(error)
    return res.status(500).send({ error: 'Error creating wallet' })
  }
})

app.get('/wallet/:walletId', async (req, res) => {
  console.log('Getting HD wallet')
  const { walletId } = req.params

  try {
    const wallet = await walletService.getWalletInfo({ walletId })
    return res.status(201).send(wallet)
  } catch (error) {
    console.error(error)
    return res.status(500).send({ error: 'Error getting wallet' })
  }
})

app.post('/wallet/:walletId/address', async (req, res) => {
  console.log('Getting HD wallet')
  const { walletId } = req.params
  const { description } = req.body

  try {
    const newNode = await walletService.generateNewAddress({ walletId, description })
    return res.status(201).send(newNode)
  } catch (error) {
    console.error(error)
    return res.status(500).send({ error: 'Error generating address' })
  }
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

app.get('/contract/:contractAddress/call', async (req, res) => {
  res.send('contract call')
})

app.post('/contract/:contractAddress/call', async (req, res) => {
  res.send('contract call')
})

export default app
