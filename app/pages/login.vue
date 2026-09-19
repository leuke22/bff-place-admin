<template>
  <div class="flex min-h-screen items-center justify-center bg-muted px-4">
    <UCard class="w-full max-w-md" :ui="{ body: 'space-y-6' }">
      <template #header>
        <div class="flex flex-col items-center gap-2 text-center">
          <UIcon name="i-lucide-lock-keyhole" class="size-8 text-primary" />
          <h1 class="text-xl font-semibold">
            Sign in
          </h1>
          <p class="text-sm text-muted">
            Enter your credentials to access the admin panel
          </p>
        </div>
      </template>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Email" name="email" required>
          <UInput
            v-model="state.email"
            type="email"
            placeholder="you@example.com"
            icon="i-lucide-mail"
            autocomplete="email"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" name="password" required>
          <UInput
            v-model="state.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-lucide-key-round"
            autocomplete="current-password"
            class="w-full"
          >
            <template #trailing>
              <UButton
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                color="neutral"
                variant="link"
                size="sm"
                :padded="false"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <div class="flex items-center justify-between">
          <UCheckbox v-model="state.remember" label="Remember me" />
          <ULink to="/forgot-password" class="text-sm font-medium text-primary">
            Forgot password?
          </ULink>
        </div>

        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          icon="i-lucide-alert-circle"
          :title="errorMessage"
        />

        <UButton
          type="submit"
          block
          size="lg"
          :loading="loading"
        >
          Sign in
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
  auth: false
})

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean().optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  email: '',
  password: '',
  remember: false
})

const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const { signIn, getSession } = useAuth();
const route = useRoute();

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  errorMessage.value = ''

  try {
    await signIn(
      { email: event.data.email, password: event.data.password },
      { redirect: false }
    )

    await getSession()

    await navigateTo((route.query.redirect as string) || '/', { external: false })
  } catch (err) {
    console.error(err)
    errorMessage.value = 'Invalid email or password. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>