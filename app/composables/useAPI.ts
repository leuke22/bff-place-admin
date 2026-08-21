export function useAPI() {
    const config = useRuntimeConfig().public
    const auth = useAuth();

    const baseUrl = `${config.baseURL}/api`
    const token = auth.token.value
    const user = auth.data.value
    
    return {
        baseUrl,
        token,
        user
    }
}