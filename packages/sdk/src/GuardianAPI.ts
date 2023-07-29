import { BigNumberish, utils, Wallet, BytesLike } from 'ethers'
import { Provider } from '@ethersproject/providers'
import _ from 'lodash'

export interface GuardianParams {
  guardians: Wallet[]
  owner: Wallet
  wallet: string
  verifyingContract: string
}

export enum ActionType{
  ApproveToken
}

export interface ApprovalOption {
  validUntil: BigNumberish
  action_type: ActionType
}

async function signTypedData (data: BytesLike, signer: Wallet, approvalOption: ApprovalOption, domain: any, initValue: {userOpHash: string, wallet: string, validUntil: BigNumberish}): Promise<string> {
  switch (approvalOption.action_type) {
    case ActionType.ApproveToken: {
      const result = utils.defaultAbiCoder.decode(['address', 'address', 'uint256'], data)
      const types = {
        approveToken: [
          { name: 'wallet', type: 'address' },
          { name: 'validUntil', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'userOpHash', type: 'bytes32' }
        ]
      }
      const message = {
        types,
        domain,
        primaryType: 'approveToken',
        value: {
          ...initValue,
          token: result[0],
          to: result[1],
          amount: result[2]
        }
      }
      return await signer._signTypedData(message.domain, message.types, message.value)
    }
  }
}

export class GuardianAPI {
  guardians: Wallet[]
  owner: Wallet
  wallet: string
  verifyingContract: string

  constructor (guardianParams: GuardianParams, readonly provider: Provider) {
    this.owner = guardianParams.owner
    this.guardians = guardianParams.guardians
    this.verifyingContract = guardianParams.verifyingContract
    this.wallet = guardianParams.wallet
  }

  async signUserOp (data: BytesLike, userOpHash: string, approvalOption: ApprovalOption): Promise<string> {
    const calldata = utils.hexDataSlice(data, 4)
    const { chainId } = await this.provider.getNetwork()
    const domain = {
      name: 'LoopringWallet',
      version: '2.0.0',
      chainId,
      verifyingContract: this.verifyingContract
    }

    const smartWalletOrEOASigners: Array<{ signer: Wallet, smartWalletAddress?: string }> = [{ signer: this.owner }]
    // TODO(signer should be the owner of the wallet when the guardian is smart wallet )
    this.guardians.map(g => smartWalletOrEOASigners.push({ smartWalletAddress: g.address, signer: g }))

    const signatures = await Promise.all(
      smartWalletOrEOASigners.map(async (g) =>
        await signTypedData(calldata, g.signer, approvalOption, domain, { wallet: this.wallet, userOpHash, validUntil: approvalOption.validUntil })
      )
    )

    const [sortedSigners, sortedSignatures] = _.unzip(
      _.sortBy(
        _.zip(
          smartWalletOrEOASigners.map((g) =>
            g.smartWalletAddress != null
              ? g.smartWalletAddress.toLowerCase()
              : g.signer.address.toLowerCase()
          ),
          signatures
        ),
        item => item[0]
      )
    )

    const approval = {
      signers: sortedSigners,
      signatures: sortedSignatures,
      validUntil: approvalOption.validUntil
    }
    const signature = utils.defaultAbiCoder.encode(
      ['tuple(address[] signers,bytes[] signatures,uint256 validUntil)'],
      [approval]
    )
    return signature
  }
}
