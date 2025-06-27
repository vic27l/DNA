// src/lib/custom-supabase-adapter.ts
import { createClient } from '@supabase/supabase-js'
import type { Adapter, AdapterUser, AdapterAccount, AdapterSession, VerificationToken } from 'next-auth/adapters'

export function CustomSupabaseAdapter(config: {
  url: string
  secret: string
}): Adapter {
  const { url, secret } = config
  const supabase = createClient(url, secret, {
    auth: {
      persistSession: false,
    },
  })

  return {
    async createUser(user) {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: crypto.randomUUID(),
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified?.toISOString(),
          image: user.image,
        })
        .select()
        .single()

      if (error) throw error
      return data as AdapterUser
    },

    async getUser(id) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error) return null
      return data as AdapterUser
    },

    async getUserByEmail(email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error) return null
      return data as AdapterUser
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const { data, error } = await supabase
        .from('accounts')
        .select('*, users(*)')
        .eq('provider', provider)
        .eq('providerAccountId', providerAccountId)
        .single()

      if (error) return null
      return data.users as AdapterUser
    },

    async updateUser(user) {
      const { data, error } = await supabase
        .from('users')
        .update({
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified?.toISOString(),
          image: user.image,
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data as AdapterUser
    },

    async deleteUser(userId) {
      await supabase.from('users').delete().eq('id', userId)
    },

    async linkAccount(account) {
      const { error } = await supabase
        .from('accounts')
        .insert({
          id: crypto.randomUUID(),
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        })

      if (error) throw error
      return account
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await supabase
        .from('accounts')
        .delete()
        .eq('provider', provider)
        .eq('providerAccountId', providerAccountId)
    },

    async createSession({ sessionToken, userId, expires }) {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          id: crypto.randomUUID(),
          sessionToken,
          userId,
          expires: expires.toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data as AdapterSession
    },

    async getSessionAndUser(sessionToken) {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, users(*)')
        .eq('sessionToken', sessionToken)
        .single()

      if (error) return null
      return {
        session: data as AdapterSession,
        user: data.users as AdapterUser,
      }
    },

    async updateSession({ sessionToken, expires, userId }) {
      const { data, error } = await supabase
        .from('sessions')
        .update({
          expires: expires?.toISOString(),
          userId,
        })
        .eq('sessionToken', sessionToken)
        .select()
        .single()

      if (error) throw error
      return data as AdapterSession
    },

    async deleteSession(sessionToken) {
      await supabase.from('sessions').delete().eq('sessionToken', sessionToken)
    },

    async createVerificationToken({ identifier, expires, token }) {
      const { data, error } = await supabase
        .from('verification_tokens')
        .insert({
          identifier,
          token,
          expires: expires.toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return data as VerificationToken
    },

    async useVerificationToken({ identifier, token }) {
      const { data, error } = await supabase
        .from('verification_tokens')
        .delete()
        .eq('identifier', identifier)
        .eq('token', token)
        .select()
        .single()

      if (error) return null
      return data as VerificationToken
    },
  }
}
