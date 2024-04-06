import * as AWS from '@aws-sdk/client-kms'

export class KmsManager {
  private readonly kmsClient: AWS.KMS

  constructor (
    private readonly dataKeyId: string,
    awsKey: string,
    awsSecret: string,
    region: string
  ) {
    this.kmsClient = new AWS.KMS({
      region,
      credentials: { accessKeyId: awsKey, secretAccessKey: awsSecret }
    })
  }

  async encrypt (src: string): Promise<string> {
    const resp = await this.kmsClient.encrypt({
      KeyId: this.dataKeyId,
      Plaintext: Buffer.from(src)
    })

    // Get the encrypted data.
    const encryptedData = resp.CiphertextBlob ?? ''
    return Buffer.from(encryptedData).toString('base64')
  }
}
