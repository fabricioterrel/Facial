import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tahebeiuyyzebnvkahkq.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_KB23qIznBbiU7jkq589yDA_9x3aEoON';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);