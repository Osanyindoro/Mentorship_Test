// Supabase Client Service Configuration (Singleton Instance)

const SUPABASE_URL = 'https://wbzkaealhtsawfqvzccq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiemthZWFsaHRzYXdmcXZ6Y2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MjI5NTIsImV4cCI6MjEwMjM5ODk1Mn0.UrMDyqT1JuBsF6JtHLc5I5qCswiXyTz7ihGLovApZws';

let instance = null;

export const getSupabaseClient = () => {
  if (!instance && typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    instance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return instance;
};

export const supabase = getSupabaseClient();
