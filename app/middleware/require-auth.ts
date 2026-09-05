export default defineNuxtRouteMiddleware(async (to) => {
  const { status, getSession } = useAuth()

  if (status.value !== 'authenticated') {
    await getSession()
  }

  if (status.value !== 'authenticated') {
    // access token expired or missing — try a manual refresh before giving up
    try {
      await $fetch('/api/auth/refresh', { method: 'POST' })
      await getSession()
    } catch {
      // refresh genuinely failed (refresh_token also expired/invalid) — fall through
    }
  }

  if (status.value !== 'authenticated') {
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})