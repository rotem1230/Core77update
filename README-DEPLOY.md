# 🚀 פריסת core77.app על שרת Ubuntu

מדריך מהיר להעלאת Dyad לדומיין `core77.app` עם Docker ו-SSL.

## ✅ דרישות מוקדמות

- שרת Ubuntu 20.04+ עם גישת SSH
- הדומיין `core77.app` מפנה לכתובת IP של השרת
- גישת sudo

## 🚀 פריסה מהירה (3 דקות)

### 1. העתק קבצים לשרת

```bash
# מהמחשב המקומי שלך
scp -r . user@your-server-ip:/tmp/dyad-deploy/
```

### 2. הרץ התקנה אוטומטית

```bash
# התחבר לשרת
ssh user@your-server-ip

# הרץ התקנה
cd /tmp/dyad-deploy
sudo chmod +x quick-deploy-core77.sh
sudo ./quick-deploy-core77.sh
```

### 3. העתק קבצי הפרויקט

```bash
# על השרת
sudo cp -r /tmp/dyad-deploy/* /opt/dyad/
cd /opt/dyad
```

### 4. הרץ האפליקציה

```bash
# בנה והרץ
sudo docker-compose up -d --build

# בדוק שרץ
sudo docker-compose ps
```

### 5. הגדר SSL

```bash
# קבל תעודת SSL חינמית
sudo certbot --nginx -d core77.app -d www.core77.app
```

### 6. בדוק שהכל עובד

גש ל-https://core77.app - אמור לראות את אפליקציית Dyad!

---

## 🔧 פקודות שימושיות

```bash
# צפייה בלוגים
sudo docker-compose logs -f

# הפעלה מחדש
sudo docker-compose restart

# עצירה
sudo docker-compose down

# בדיקת סטטוס
sudo systemctl status nginx docker
sudo docker-compose ps
```

## 🆘 פתרון בעיות

**האפליקציה לא עולה?**
```bash
sudo docker-compose logs -f
```

**בעיות SSL?**
```bash
sudo certbot renew
sudo nginx -t
sudo systemctl reload nginx
```

**הדומיין לא עובד?**
- בדוק ש-core77.app מפנה לשרת שלך
- בדוק ש-DNS התעדכן (יכול לקחת עד 24 שעות)

---

**🎉 זהו! האפליקציה שלך תהיה זמינה ב-https://core77.app** 