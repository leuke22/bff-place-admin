export default defineEventHandler(async (event) => {
    const cookie = getHeader(event, 'cookie')
    console.log('[refresh.post.ts] raw cookie header:', cookie)

    if (!cookie || !cookie.includes('refresh_token')) {
        throw createError({ statusCode: 401, statusMessage: 'No refresh token provided' })
    }

    try {
        const response = await $fetch.raw('http://localhost:5000/api/auth/refresh', {
            method: 'POST',
            headers: cookie ? { cookie } : {}
        })

        const setCookie = response.headers.get('set-cookie')
        if (setCookie) {
            appendHeader(event, 'set-cookie', setCookie)
        }

        return response._data
    } catch (err: any) {
        throw createError({
            statusCode: err.response?.status || 401,
            statusMessage: err.data?.message || 'Refresh failed'
        })
    }
})