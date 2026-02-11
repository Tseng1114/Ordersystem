import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://eyahdrptpwegfreaqacw.supabase.co"
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5YWhkcnB0cHdlZ2ZyZWFxYWN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MDY0NjksImV4cCI6MjA4NDk4MjQ2OX0.7ZPY035-_RbQGqLTpKzwC-Vz9HdlDFxYemeCAAYC1aM"

export const supabase = createClient(supabaseUrl, supabaseKey)

console.log('Supabase 已初始化:', supabase)

/*
beta version
*/
