// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/hints',
    '@nuxt/image',
    '@artmizu/nuxt-prometheus',
    '@nuxtjs/google-fonts',
    '@pinia/nuxt',
    '@sidebase/nuxt-auth'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  ui: {
    theme: {
      colors: [
        'primary',
        'secondary',
        'tertiary',
        'info',
        'success',
        'warning',
        'error',
        'neutral'
      ]
    }
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  runtimeConfig: {
    public: {
      baseURL: 'http://localhost:5000',
      uploadServiceURL: 'http://localhost:5001'
    }
  },

  auth: {
    baseURL: 'http://localhost:3001/api/auth',
    provider: {
      type: 'local',
      endpoints: {
        signIn: { path: '/login', method: 'post' },
        signOut: { path: '/logout', method: 'post' },
        signUp: { path: '/register', method: 'post' },
        getSession: { path: '/me', method: 'get' }
      },
      pages: { login: '/login' },
      token: {
        signInResponseTokenPointer: '/access_token',
        type: 'Bearer',
        headerName: 'Authorization',
        maxAgeInSeconds: 60 * 30
      },
      refresh: {
        isEnabled: true,
        endpoint: { path: '/refresh', method: 'post' },
        refreshOnlyToken: true,
        token: {
          refreshResponseTokenPointer: '/access_token',
          signInResponseRefreshTokenPointer: '/refreshToken'
        }
      },
      session: {
        dataType: {
          id: 'number',
          uuid: 'string',
          first_name: 'string',
          last_name: 'string',
          email: 'string',
          avatar: 'string'
        },
        dataResponsePointer: '/user'
      },
    },
    sessionRefresh: {
      enablePeriodically: false,
      enableOnWindowFocus: true
    }
  }
})