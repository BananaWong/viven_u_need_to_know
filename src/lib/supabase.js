import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 只有当两个 Key 都有值时才初始化真实的客户端
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      // 这是一个 Mock 客户端，防止调用时报错
      from: () => ({
        select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
        insert: () => ({ select: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }) }),
        update: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) })
      })
    };
