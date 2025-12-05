# Heroku Environment Variables Setup

## Required Environment Variables

Set these in Heroku Dashboard → Settings → Config Vars:

### 1. MongoDB Connection (REQUIRED)

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/poolnplay?retryWrites=true&w=majority
```

- Get this from MongoDB Atlas (if using Atlas)
- Or use your MongoDB connection string
- **This is required for the app to work!**

### 2. Session Secret (REQUIRED)

```
SESSION_SECRET=your-random-secret-string-here
```

- Generate a random string (at least 32 characters)
- Used for encrypting sessions
- **This is required for admin login to work!**

### 3. Admin Credentials (REQUIRED)

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

- Change these from defaults!
- Used for admin panel login

### 4. Email Configuration (REQUIRED for contact forms)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_TO=markagrover85@gmail.com
```

- For Gmail: Use an App Password (not your regular password)
- Generate App Password: https://myaccount.google.com/apppasswords

### 5. Optional Settings

```
NODE_ENV=production
PORT=3000
```

- PORT is automatically set by Heroku (don't override)
- NODE_ENV is automatically set to 'production' on Heroku

## How to Set Variables in Heroku

### Via Heroku Dashboard:

1. Go to your app in Heroku Dashboard
2. Click "Settings"
3. Click "Reveal Config Vars"
4. Add each variable above

### Via Heroku CLI:

```bash
heroku config:set MONGODB_URI="your-connection-string"
heroku config:set SESSION_SECRET="your-secret"
heroku config:set ADMIN_USERNAME="admin"
heroku config:set ADMIN_PASSWORD="your-password"
heroku config:set SMTP_HOST="smtp.gmail.com"
heroku config:set SMTP_PORT="587"
heroku config:set SMTP_USER="your-email@gmail.com"
heroku config:set SMTP_PASS="your-app-password"
heroku config:set EMAIL_TO="markagrover85@gmail.com"
```

## Verify Variables Are Set

```bash
heroku config
```

## Common Issues

### App Crashes (H10 Error)

- Check that MONGODB_URI is set correctly
- Check Heroku logs: `heroku logs --tail`
- Verify MongoDB connection string is valid

### Home Page Errors

- Usually means MONGODB_URI is missing or incorrect
- Check MongoDB connection string format
- Ensure database name is in the connection string

### Admin Login Not Working

- Check SESSION_SECRET is set
- Verify ADMIN_USERNAME and ADMIN_PASSWORD are correct

### Email Not Sending

- Verify SMTP credentials are correct
- For Gmail, use App Password (not regular password)
- Check SMTP_HOST and SMTP_PORT are correct
