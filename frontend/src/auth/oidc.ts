import { UserManager, WebStorageStateStore } from 'oidc-client-ts'

const authority = import.meta.env.VITE_AUTHENTIK_URL as string
const clientId = import.meta.env.VITE_AUTHENTIK_CLIENT_ID as string

export const userManager = new UserManager({
  authority,
  client_id: clientId,
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
})
