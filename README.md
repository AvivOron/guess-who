# ניחוש מי? 🎭

משחק ניחוש המפורסמים הישראלים – עד 10 שחקנים!

## איך משחקים

1. מארגן יוצר משחק ומשתף קוד/קישור
2. שחקנים מצטרפים
3. מארגן לוחץ "התחל משחק"
4. כל שחקן בתורו מקבל תמונת מפורסם ישראלי – אבל הוא לא רואה אותה!
5. השחקן שואל שאלות כן/לא, השאר עונים
6. מארגן לוחץ "ניחש נכון" / "לא נכון" ואז "תור הבא"

## הרצה מקומית

```bash
npm run install:all
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:3001

## הוספת תמונות מפורסמים

הוסף תמונות לתיקייה `public/images/celebrities/` עם השמות המתאימים מ-`server/data/celebrities.js`.

## פריסה

### Backend → Railway

1. דחוף ל-GitHub
2. צור פרויקט חדש ב-[Railway](https://railway.app)
3. חבר את ה-repo
4. הגדר Root Directory: `server`
5. הגדר Start Command: `node index.js`
6. הוסף Environment Variable: `CLIENT_ORIGIN=https://your-app.vercel.app`

### Frontend → Vercel

1. צור פרויקט חדש ב-[Vercel](https://vercel.com)
2. חבר את ה-repo
3. הגדר Build Command: `npm run build --prefix client`
4. הגדר Output Directory: `client/dist`
5. הוסף Environment Variable: `VITE_WS_HOST=your-server.up.railway.app`
