
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sfkltbviggvdxfjqsrwi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNma2x0YnZpZ2d2ZHhmanFzcndpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNTU3ODcsImV4cCI6MjA4MjkzMTc4N30.JNHNSNBL3Smb_1sCQXmrTiU_iSUY1MkrOcdCnCrxK_U';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
