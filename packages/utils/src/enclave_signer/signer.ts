import { Signer, BigNumber, ethers } from 'ethers'
import { defineReadOnly } from '@ethersproject/properties'
import { Provider, TransactionRequest } from '@ethersproject/abstract-provider'
import { EnclaveClient } from './enclave_client'
import { EnclaveConfig, TxPayloadEIP1559 } from './types'
// import { Logger } from '@ethersproject/logger'

export class EnclaveSigner extends Signer {
  // eslint-disable-next-line
  enclave_client: EnclaveClient

  constructor (readonly enclaveConfig: EnclaveConfig, readonly address: string, provider?: Provider) {
    super()
    defineReadOnly(this, 'provider', provider)
    this.enclave_client = new EnclaveClient(enclaveConfig)
  }

  async getAddress (): Promise<string> {
    return await Promise.resolve(this.address)
  }

  async signMessage (message: string): Promise<string> {
    throw new Error('')
  }

  async signTransaction (tx: TransactionRequest): Promise<string> {
    const txPayload: TxPayloadEIP1559 = {
      nonce: tx.nonce ?? BigNumber.from(0),
      gas: tx.gasLimit ?? BigNumber.from(0),
      to: tx.to ?? '0x',
      value: tx.value ?? BigNumber.from(0),
      data: ethers.utils.hexlify(tx.data ?? '0x'),
      chainId: tx.chainId ?? 0,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas ?? BigNumber.from(0),
      maxFeePerGas: tx.maxFeePerGas ?? BigNumber.from(0)
    }
    const { signedTx } = await this.enclave_client.sign(txPayload, this.enclaveConfig.secretId)
    return signedTx
  }

  connect (provider: Provider): EnclaveSigner {
    return new EnclaveSigner(this.enclaveConfig, this.address, provider)
  }
}
