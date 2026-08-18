export default defineEventHandler(async (event) => {
  const body = await readBody(event)

    try {
        const response = await $fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            body
        })

        return response
    } catch (err: any) {
        console.error('Login proxy error:', err.data || err.message)

        throw createError({
            statusCode: err.response?.status || 401,
            statusMessage: err.data?.message || 'Invalid credentials'
        })
    }
})