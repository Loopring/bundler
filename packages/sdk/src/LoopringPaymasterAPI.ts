import { UserOperationStruct, LoopringPaymaster__factory, LoopringPaymaster } from '@account-abstraction/contracts'
import { BigNumberish, utils, Signer } from 'ethers'

export interface LoopringPaymasterParams {
  paymaster: string
  paymasterOwner: Signer
}

export interface LoopringPaymasterOption {
  payToken: string
  valueOfEth: BigNumberish
  validUntil: BigNumberish
}

/**
 * an API to external a UserOperation with paymaster info
 */
export class LoopringPaymasterAPI {
  paymaster: LoopringPaymaster
  paymasterOwner: Signer

  constructor (params: LoopringPaymasterParams) {
    this.paymaster = LoopringPaymaster__factory.connect(params.paymaster, params.paymasterOwner)
    this.paymasterOwner = params.paymasterOwner
  }

  /**
   * @param userOp a partially-filled UserOperation (without signature and paymasterAndData
   *  note that the "preVerificationGas" is incomplete: it can't account for the
   *  paymasterAndData value, which will only be returned by this method..
   * @returns the value to put into the PaymasterAndData, undefined to leave it empty
   */
  async getPaymasterAndData (userOp: UserOperationStruct, paymasterOption: LoopringPaymasterOption): Promise<string | undefined> {
    const payToken = paymasterOption.payToken
    const valueOfEth = paymasterOption.valueOfEth
    const validUntil = paymasterOption.validUntil
    const packedData = utils.solidityKeccak256(
      ['address', 'uint48', 'uint256'],
      [paymasterOption.payToken, validUntil, valueOfEth]
    )

    const newUserOp = {
      ...userOp,
      signature: '0x',
      paymasterAndData: '0x'
    }
    const hash = await this.paymaster.getHash(newUserOp, packedData)

    const sig = await this.paymasterOwner.signMessage(utils.arrayify(hash))
    const paymasterCalldata = utils.defaultAbiCoder.encode(
      ['address', 'uint48', 'uint256', 'bytes'],
      [payToken, validUntil, valueOfEth, sig]
    )
    return utils.hexConcat([this.paymaster.address, paymasterCalldata])
  }
}
