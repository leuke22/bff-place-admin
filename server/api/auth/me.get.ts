export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, 'authorization')
    console.log('[me.get.ts] authHeader received:', authHeader);

    try {
        const response = await $fetch('http://localhost:5000/api/auth/me', {
            method: 'GET',
            headers: authHeader ? { authorization: authHeader } : {}
        })

        return response
    } catch (err: any) {
        throw createError({
            statusCode: err.response?.status || 401,
            statusMessage: err.data?.message || 'Not authenticated'
        })
    }
})