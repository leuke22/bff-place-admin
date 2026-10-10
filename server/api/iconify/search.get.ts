export default defineEventHandler(async (event) => {
    const query = getQuery(event).query

    if (typeof query !== 'string' || query.trim().length < 1 || query.length > 100) {
        throw createError({ statusCode: 400, statusMessage: 'A search query is required' })
    }

    const rawLimit = Number(getQuery(event).limit ?? 64)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 32), 999) : 64

    try {
        return await $fetch<{ icons: string[] }>('https://api.iconify.design/search', {
            query: { query: query.trim(), limit },
            timeout: 10000,
        })
    } catch {
        throw createError({ statusCode: 502, statusMessage: 'Iconify search failed' })
    }
})
