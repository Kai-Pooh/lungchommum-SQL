import { createClient } from '@supabase/supabase-js';

// อ่านค่าจาก Environment Variables ที่ตั้งไว้บน Vercel
// (NEXT_PUBLIC_ นำหน้าเพื่อให้ค่านี้ใช้งานได้ฝั่ง browser)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
