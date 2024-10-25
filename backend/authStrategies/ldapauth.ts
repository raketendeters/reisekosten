import LdapAuth from 'ldapauth-fork'
import LdapStrategy from 'passport-ldapauth'
import { ldapauthSettings } from '../../common/types.js'
import { AuthenticationStrategy, findOrCreateUser } from './index.js'

class Ldapauth extends AuthenticationStrategy<LdapStrategy, ldapauthSettings> {
  #mapConfig(config: ldapauthSettings): LdapStrategy.Options['server'] {
    return {
      url: config.url,
      bindDN: config.bindDN,
      bindCredentials: config.bindCredentials,
      searchBase: config.searchBase,
      searchFilter: config.searchFilter,
      tlsOptions: {
        rejectUnauthorized: config.tlsOptions.rejectUnauthorized
      }
    }
  }
  configureStrategy(config: ldapauthSettings) {
    this.strategy = new LdapStrategy(
      {
        server: this.#mapConfig(config)
      },
      async function (ldapUser: any, cb: (error: any, user?: any) => void) {
        let email: string | string[] = ldapUser[config.mailAttribute]

        findOrCreateUser(
          { ldapauth: ldapUser[config.uidAttribute] },
          {
            email: Array.isArray(email) ? (email.length > 0 ? email[0] : '') : email,
            name: { familyName: ldapUser[config.familyNameAttribute], givenName: ldapUser[config.givenNameAttribute] }
          },
          cb
        )
      }
    )
  }
  verifyConfig(config: ldapauthSettings) {
    return new Promise((resolve, reject) => {
      try {
        const ldapAuthInstance = new LdapAuth(this.#mapConfig(config))
        const adminClient = (ldapAuthInstance as any)._adminClient
        const userClient = (ldapAuthInstance as any)._userClient
        ldapAuthInstance.on('error', reject)
        adminClient.on('error', reject)
        adminClient.on('connectTimeout', reject)
        adminClient.on('connectError', reject)
        userClient.on('error', reject)
        userClient.on('connectTimeout', reject)
        userClient.on('connectError', reject)

        adminClient.once('connect', () => {
          resolve(ldapAuthInstance)
        })
      } catch (err) {
        reject(err)
      }
    })
  }
}

export default new Ldapauth()
