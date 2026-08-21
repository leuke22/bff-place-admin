export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    const response = await $fetch.raw('http://localhost:5000/api/auth/login', {
        method: 'POST',
        body,
        credentials: 'include'
    })

    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
        appendHeader(event, 'set-cookie', setCookie)
    }

    return response._data
})