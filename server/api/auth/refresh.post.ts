// server/api/auth/refresh.post.ts
export default defineEventHandler(async (event) => {
    const cookie = getHeader(event, 'cookie') // browser's cookie header, contains refresh_token

    const response = await $fetch.raw('http://localhost:5000/api/auth/refresh', {
        method: 'POST',
        headers: cookie ? { cookie } : {}
    })

    return response._data
})