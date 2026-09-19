// server/api/auth/logout.post.ts
export default defineEventHandler(async (event) => {
    const cookieHeader = getHeader(event, 'cookie')

    try {
        await $fetch('http://localhost:5000/api/auth/logout', {
            method: 'POST',
            headers: cookieHeader ? { cookie: cookieHeader } : {}
        })
    } catch {
        // best-effort — clear cookies regardless
    }

    deleteCookie(event, 'access_token', { path: '/' })
    deleteCookie(event, 'refresh_token', { path: '/api/auth' })

    return { success: true }
})