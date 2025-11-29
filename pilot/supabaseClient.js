// קובץ זה מאתחל את הלקוח של Supabase
// חשוב: אנו משתמשים כאן רק במפתחות הציבוריים (anon key) שהם בטוחים לשימוש בצד הלקוח (בדפדפן).
// חוקי האבטחה שהגדרת ב-Supabase (Row Level Security) הם אלו ששומרים על המידע שלך.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// פרטי ההתחברות הציבוריים לפרויקט ה-Supabase שלך
const supabaseUrl = 'https://ifiscrcwexveonujcvku.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmaXNjcmN3ZXh2ZW9udWpjdmt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjQwNzAsImV4cCI6MjA3OTk0MDA3MH0.GwnHRHCo-2AGuHFgEOwCcpl3m0vvqxKc_nMHkihqtBo';

// יצירת אובייקט לקוח של Supabase וייצוא שלו
// נוכל לייבא את האובייקט 'supabase' הזה בכל קובץ אחר בפרויקט
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// הערה: המפתחות הסודיים (service_role) נשמרים בקובץ .env
// וייעשה בהם שימוש רק בצד השרת, אם וכאשר נבנה כזה.
// לעולם אין לחשוף אותם בקוד שרץ בדפדפן.