import { createClient } from '@supabase/supabase-js'
import { workerConfig } from './config.js'

export const supabaseAdmin = createClient(
  workerConfig.supabaseUrl,
  workerConfig.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
)
