import axios from 'axios'
import { KmsManager } from './kms_manager'
import {
  TxPayloadEIP1559,
  EnclaveRes,
  EnclaveSignType,
  EnclaveConfig
} from './types'
import { ethers } from 'ethers'

export class EnclaveClient {
  private readonly kmsManager: KmsManager
  private readonly enclaveUri: string

  constructor (
    enclaveConfig: EnclaveConfig
  ) {
    this.kmsManager = new KmsManager(
      enclaveConfig.kmsDataKey,
      enclaveConfig.awsKey,
      enclaveConfig.awsSecret,
      'us-east-2'
    )
    this.enclaveUri = enclaveConfig.enclaveUri
  }

  async sign (tx: TxPayloadEIP1559, secretId: string): Promise<EnclaveRes> {
    const reqJson = await this.toL1TxReqJson(tx, secretId)
    return await this.doPost(reqJson)
  }

  async doPost (jsonStr: string): Promise<EnclaveRes> {
    const res = await axios.post(this.enclaveUri, jsonStr)
    const data = res.data as {
      transaction_signed: string
      transaction_hash: string
    }
    return {
      signedTx: data.transaction_signed,
      txHash: data.transaction_hash,
      success: true
    }
  }

  private async toL1TxReqJson (
    payload: TxPayloadEIP1559,
    secretId: string
  ): Promise<string> {
    const payloadJson = JSON.stringify(payload)

    const plainText = JSON.stringify({
      method: 'sign_transaction',
      transaction_payload: payloadJson,
      secret_id: secretId,
      sign_type: EnclaveSignType.ecdsaEIP1559
    })
    const reqHash = await this.kmsManager.encrypt(
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes(payloadJson))
    )
    return JSON.stringify({
      req: plainText,
      reqHash
    })
  }
}
