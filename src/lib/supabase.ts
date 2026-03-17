import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = 'https://nfamnqywhtyoficaoyme.supabase.co';
const supabaseAnonKey = 'sb_publishable_qXMZWqr0obQW6fkvCk_AYw_D-pw13af';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
