import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hmudbxodylypbonnrimp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtdWRieG9keWx5cGJvbm5yaW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1OTE1ODAsImV4cCI6MjA3NzE2NzU4MH0.XRFo0kUWc9uunAmsJr4wRReeQlGwFrDMddwz-E6cn9w'

export const supabase = createClient(supabaseUrl, supabaseKey)
