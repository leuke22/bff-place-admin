export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, 'authorization')
    const body = await readBody(event).catch(() => undefined)

    try {
        const response = await $fetch('http://localhost:5000/api/auth/logout', {
            method: 'POST',
            headers: authHeader ? { authorization: authHeader } : {},
            body
        })

        return response
    } catch (err: any) {
        throw createError({
            statusCode: err.response?.status || 401,
            statusMessage: err.data?.message || 'Logout failed'
        })
    }
})