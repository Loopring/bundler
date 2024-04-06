import { BigNumberish } from 'ethers'

export interface EnclaveL1TxReq {
  method: string
  transaction_payload: string
  secret_id: string
  sign_type: number
}

export interface TxPayloadEIP1559 {
  nonce: BigNumberish
  gas: BigNumberish
  to: string
  value: BigNumberish
  data: string
  chainId: number
  maxPriorityFeePerGas: BigNumberish
  maxFeePerGas: BigNumberish
}

export interface EnclaveReq {
  req: string
  reqHash: string
}

export interface EnclaveRes {
  signedTx: string
  txHash: string
  success: boolean
}

export enum EnclaveSignType {
  ecdsaLegacy,
  ecdsaEIP1559,
  eddsa,
}

export interface EnclaveConfig {
  enclaveUri: string
  kmsDataKey: string
  awsKey: string
  awsSecret: string
  secretId: string
}
