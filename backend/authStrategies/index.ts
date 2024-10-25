import { HydratedDocument } from 'mongoose'
import passport from 'passport'
import { Contact, User as IUser } from '../../common/types.js'
import { getSettings } from '../helper.js'
import User from '../models/user.js'

export interface NewUser extends Contact {
  fk?: IUser['fk']
  access?: IUser['access']
}

export function addAdminIfNone(user: HydratedDocument<IUser>) {
  User.exists({ 'access.admin': true }).then((doc) => {
    if (doc === null) {
      user.access.admin = true
      user.markModified('access')
      user.save()
    }
  })
}

export async function findOrCreateUser(filter: IUser['fk'], userData: Omit<NewUser, 'fk'>, cb: (error: any, user?: Express.User) => void) {
  let user = await User.findOne({ fk: filter })
  let email = userData.email
  if (!user && email) {
    user = await User.findOne({ email: email })
  }
  const newUser: NewUser = {
    fk: filter,
    email: email,
    name: userData.name,
    access: (await getSettings()).defaultAccess
  }
  if (!user) {
    user = new User(newUser)
  } else {
    delete newUser.access
    Object.assign(user.fk, newUser.fk)
    delete newUser.fk
    Object.assign(user, newUser)
  }
  try {
    await user.save()
    addAdminIfNone(user)
    cb(null, user)
  } catch (error) {
    cb(error)
  }
}

export abstract class AuthenticationStrategy<Strategy extends passport.Strategy, Options extends any> {
  strategy: Strategy | undefined

  getStrategy() {
    if (!this.strategy) {
      throw new Error(`${this.constructor.name} Strategy is not configured`)
    }
    return this.strategy
  }

  abstract configureStrategy(config: Options): void
}
