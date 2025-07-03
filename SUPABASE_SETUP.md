# הגדרת Supabase עבור מערכת ההתחברות

> **חשוב:** ללא הטבלה `profiles`, המערכת תעבוד רק עם התחברות בסיסית ללא נתוני פרופיל.

## שלב 1: יצירת פרויקט Supabase

1. **לך לאתר Supabase**: https://supabase.com
2. **הירשם/התחבר** לחשבון שלך
3. **לחץ על "New Project"**
4. **בחר ארגון או צור חדש**
5. **מלא פרטי הפרויקט:**
   - שם הפרויקט: `core77-auth` (או שם שבחרת)
   - סיסמת מסד נתונים: **שמור סיסמה חזקה!**
   - איזור: בחר הקרוב אליך
6. **לחץ "Create new project"**

## שלב 2: קבלת פרטי התחברות

אחרי שהפרויקט נוצר:

1. **לך ל-Settings > API**
2. **העתק את הנתונים הבאים:**
   - `Project URL` (יהיה משהו כמו `https://xxx.supabase.co`)
   - `anon public` key (המפתח הציבורי)

## שלב 3: הגדרת משתני סביבה

1. **צור קובץ `.env` בתיקיית הפרויקט:**
```bash
# ב-dyad-main צור קובץ .env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

2. **החלף את הערכים** בערכים האמיתיים מהפרויקט שלך

## שלב 4: יצירת טבלאות במסד הנתונים (נדרש!)

**זהו השלב החשוב ביותר!** ללא הטבלה `profiles`, תקבל שגיאות.

1. **לך ל-SQL Editor ב-Supabase Console**
2. **הרץ את השאילתה המלאה הזו** ליצירת טבלת profiles עם כל ההגדרות:

```sql
-- יצירת טבלת profiles (אם היא לא קיימת)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- הפעלת Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- מחיקת מדיניות קיימת אם קיימת ויצירת חדשה
DROP POLICY IF EXISTS "משתמשים יכולים לראות רק את הפרופיל שלהם" ON public.profiles;
CREATE POLICY "משתמשים יכולים לראות רק את הפרופיל שלהם" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "משתמשים יכולים לעדכן רק את הפרופיל שלהם" ON public.profiles;
CREATE POLICY "משתמשים יכולים לעדכן רק את הפרופיל שלהם" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "משתמשים יכולים ליצור את הפרופיל שלהם" ON public.profiles;
CREATE POLICY "משתמשים יכולים ליצור את הפרופיל שלהם" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- מחיקת הטריגר הקיים ויצירת חדש
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- פונקציה ליצירת פרופיל אוטומטית כשמשתמש נרשם
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id, 
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  RETURN new;
END;
$$;

-- טריגר שמפעיל את הפונקציה כשמשתמש חדש נרשם
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## שלב 5: הגדרת Authentication

1. **לך ל-Authentication > Settings**
2. **בחלק Site URL הוסף:**
   - `http://localhost:3000` (עבור פיתוח)
   - כל URL נוסף שתצטרך

3. **בחלק Email Templates** (אופציונלי):
   - תוכל להתאים את תבניות האימייל לעברית

## שלב 6: בדיקת החיבור

1. **הפעל את המערכת:**
```bash
npm start
```

2. **לך לכתובת** `http://localhost:3000/auth`
3. **נסה להירשם עם אימייל חדש**
4. **בדוק שקיבלת אימייל אישור**
5. **לחץ על הקישור באימייל**
6. **התחבר למערכת**

## שלב 7: בעיות נפוצות

### ❌ "relation \"public.profiles\" does not exist"
- **פתרון:** הרץ את השאילתה מ שלב 4 ב-SQL Editor של Supabase
- **זה השגיאה הנפוצה ביותר!**

### ❌ "Supabase URL not configured"
- **פתרון:** בדוק שיש לך קובץ `.env` עם המשתנים הנכונים

### ❌ "Invalid API key"
- **פתרון:** בדוק שהעתקת את ה-anon key הנכון מ-Supabase Console

## 🎉 סיימת!

עכשיו יש לך מערכת התחברות מלאה עם:
- ✅ הרשמה והתחברות
- ✅ אימות אימייל
- ✅ ניהול פרופיל משתמש
- ✅ הגנה על דפים
- ✅ תפריט משתמש עם התנתקות

**הערה חשובה:** אל תחשוף את ה-`.env` קובץ או את המפתחות ב-Git! 