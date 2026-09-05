// server/api/auth/login.post.ts
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    console.log('event', event);
    console.log('body', body);

    const response = await $fetch.raw('http://localhost:5000/api/auth/login', {
        method: 'POST',
        body,
        credentials: 'include'
    })

    const backendCookie = response.headers.get('set-cookie')

    console.log('backendCookie', backendCookie);

    if (backendCookie) {
        appendHeader(event, 'set-cookie', backendCookie)
    }

    console.log('response', response);
    console.log('response_data', response._data);

    const data = response._data as { user: object; access_token: string }

    return {
        user: data.user,
        access_token: data.access_token,
        refreshToken: 'managed-via-httponly-cookie'
    }
})