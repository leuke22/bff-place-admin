export default defineNuxtRouteMiddleware(async (to) => {
  const { status, getSession, refresh } = useAuth()
  const loginRoute = `/login?redirect=${encodeURIComponent(to.fullPath)}`

  if (status.value !== 'authenticated') {
    try {
      await refresh()        // gets a new access token and reloads the session
    } catch {
      return navigateTo(loginRoute)
    }
  }

  if (status.value !== 'authenticated') await getSession()
  if (status.value !== 'authenticated') return navigateTo(loginRoute)
})