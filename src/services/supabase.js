// Supabase Client Service Configuration

const SUPABASE_URL = 'https://wbzkaealhtsawfqvzccq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiemthZWFsaHRzYXdmcXZ6Y2NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4MjI5NTIsImV4cCI6MjEwMjM5ODk1Mn0.UrMDyqT1JuBsF6JtHLc5I5qCswiXyTz7ihGLovApZws';

// Access Supabase from global window object (loaded via script tag) or create instance
export const getSupabaseClient = () => {
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return null;
};

export const supabase = getSupabaseClient();
