// server/api/auth/logout.post.ts
export default defineEventHandler(async (event) => {
    const cookie = getHeader(event, 'cookie')

    const response = await $fetch.raw('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: cookie ? { cookie } : {}
    })

    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
        appendHeader(event, 'set-cookie', setCookie)
    }

    return response._data
})