# מדריך פריסת Dyad על שרת Ubuntu עם Docker ו-SSL

מדריך זה יעזור לך להעלות את אפליקציית Dyad לשרת Ubuntu עם Docker, Nginx ותעודת SSL.

## 📋 דרישות מוקדמות

- שרת Ubuntu 20.04+ עם גישת SSH
- דומיין שמפנה לכתובת IP של השרת
- גישת root או sudo

## 🚀 התקנה אוטומטית

1. **התחבר לשרת שלך:**
   ```bash
   ssh user@your-server-ip
   ```

2. **הורד והרץ את סקריפט ההתקנה:**
   ```bash
   wget https://raw.githubusercontent.com/your-repo/dyad/main/deploy-setup.sh
   chmod +x deploy-setup.sh
   sudo ./deploy-setup.sh
   ```

3. **בצע את השלבים שהסקריפט מציג**

## 🔧 התקנה ידנית

### שלב 1: הכנת השרת

```bash
# עדכון המערכת
sudo apt update && sudo apt upgrade -y

# התקנת Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl enable docker
sudo systemctl start docker

# התקנת Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# התקנת Nginx
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx

# התקנת Certbot
sudo apt install snapd -y
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### שלב 2: העתקת הקבצים

```bash
# יצירת תיקיית הפרויקט
sudo mkdir -p /opt/dyad
sudo chown $USER:$USER /opt/dyad

# העתקת הקבצים (מהמחשב המקומי שלך)
scp -r /path/to/dyad-project/* user@your-server:/opt/dyad/
```

### שלב 3: הגדרת Nginx

1. **צור קובץ הגדרות עבור האתר:**
   ```bash
   sudo nano /etc/nginx/sites-available/dyad
   ```

2. **הכנס את התוכן הבא:**
   ```nginx
   server {
       listen 80;
       server_name core77.app www.core77.app;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name core77.app www.core77.app;
       
       location /websockify {
           proxy_pass http://localhost:6080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_read_timeout 86400;
       }
       
       location / {
           proxy_pass http://localhost:6080;
           proxy_set_header Host $host;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_read_timeout 86400;
       }
   }
   ```

3. **הפעל את האתר:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/dyad /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### שלב 4: הרצת האפליקציה

```bash
cd /opt/dyad
docker-compose up -d --build
```

### שלב 5: הגדרת SSL

```bash
sudo certbot --nginx -d core77.app -d www.core77.app
```

## ✅ בדיקת התקנה

1. **בדוק שהדוקר רץ:**
   ```bash
   docker-compose ps
   ```

2. **בדוק לוגים:**
   ```bash
   docker-compose logs -f
   ```

3. **גש לאתר:**
   פתח דפדפן ולך ל-`https://core77.app`

## 🔧 ניהול האפליקציה

### פקודות שימושיות:

```bash
# צפייה בלוגים
docker-compose logs -f

# הפעלה מחדש
docker-compose restart

# עצירה
docker-compose down

# בנייה והרצה מחדש
docker-compose up -d --build

# עדכון תעודת SSL
sudo certbot renew --dry-run
```

### מעקב ביצועים:

```bash
# שימוש במעבד וזיכרון
docker stats

# מקום דיסק
df -h

# בדיקת פורטים
netstat -tlnp | grep 6080
```

## 🛡️ אבטחה

הגדרות אבטחה שכבר כלולות:

- ✅ Firewall מוגדר (UFW)
- ✅ HTTPS עם תעודת SSL
- ✅ Security headers
- ✅ Docker בסביבה מבודדת

### הגדרות נוספות מומלצות:

```bash
# הגבלת כניסות SSH
sudo nano /etc/ssh/sshd_config
# הוסף: PermitRootLogin no

# הגדרת backup אוטומטי
crontab -e
# הוסף: 0 2 * * * docker-compose -f /opt/dyad/docker-compose.yml exec dyad tar -czf /backup/dyad-$(date +%Y%m%d).tar.gz /app/userData
```

## 🐛 פתרון בעיות

### בעיות נפוצות:

1. **האפליקציה לא עולה:**
   ```bash
   docker-compose logs -f
   docker-compose down && docker-compose up -d --build
   ```

2. **בעיות SSL:**
   ```bash
   sudo certbot renew
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **בעיות ביצועים:**
   ```bash
   # בדוק משאבים
   htop
   docker stats
   
   # נקה volumes ישנים
   docker system prune -a
   ```

## 📞 תמיכה

אם נתקלת בבעיות:

1. בדוק את הלוגים: `docker-compose logs -f`
2. וודא שהדומיין core77.app מפנה לשרת שלך
3. בדוק שהפורטים פתוחים: `sudo ufw status`
4. בדוק שהשירותים רצים: `sudo systemctl status nginx docker`

---

**הערה:** מדריך זה מתאים לשרת Ubuntu עם לפחות 2GB RAM ו-20GB דיסק פנוי. 