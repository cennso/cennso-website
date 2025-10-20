import mailjet from 'node-mailjet'

import type { Client } from 'node-mailjet'

let client: Client
export function getMailJetClient(): Client {
  if (client) {
    return client
  }

  const publicKey = process.env.MJ_APIKEY_PUBLIC
  const privateKey = process.env.MJ_APIKEY_PRIVATE
  if (!publicKey || !privateKey) {
    throw new Error(
      'MJ_APIKEY_PUBLIC and/or MJ_APIKEY_PRIVATE envs is/are not defined.'
    )
  }

  const createdClient = mailjet.apiConnect(publicKey, privateKey)
  return (client = createdClient)
}
