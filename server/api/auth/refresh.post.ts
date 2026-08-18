export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    try {
        const response = await $fetch('http://localhost:5000/api/auth/refresh', {
            method: 'POST',
            body
        })

        return response
    } catch (err: any) {
        throw createError({
            statusCode: err.response?.status || 401,
            statusMessage: err.data?.message || 'Refresh failed'
        })
    }
})