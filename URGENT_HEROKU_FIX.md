# ⚠️ URGENT: Fix MongoDB Connection on Heroku

## The Problem

Your Heroku logs show:
```
WARNING: MONGODB_URI not set. Using default local MongoDB.
MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017
```

**This means `MONGODB_URI` is NOT set in your Heroku environment variables!**

## The Fix (Do This Now!)

### Option 1: Via Heroku Dashboard (Easiest)

1. Go to: https://dashboard.heroku.com/apps/your-app-name/settings
2. Click **"Reveal Config Vars"**
3. Click **"Edit"**
4. Add this variable:
   - **Key:** `MONGODB_URI`
   - **Value:** Your MongoDB connection string (see below)
5. Click **"Save"**
6. Restart your app: Click **"More"** → **"Restart all dynos"**

### Option 2: Via Heroku CLI

```bash
# Set your MongoDB connection string
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/poolnplay?retryWrites=true&w=majority"

# Restart the app
heroku restart
```

## Where to Get Your MongoDB Connection String

### If Using MongoDB Atlas (Recommended):

1. Go to: https://cloud.mongodb.com/
2. Click on your cluster
3. Click **"Connect"**
4. Choose **"Connect your application"**
5. Copy the connection string
6. Replace `<password>` with your actual password
7. Replace `<dbname>` with `poolnplay` (or your database name)

Example:
```
mongodb+srv://username:YourPassword@cluster0.xxxxx.mongodb.net/poolnplay?retryWrites=true&w=majority
```

### If Using Another MongoDB Service:

Get your connection string from your MongoDB provider and use it as the `MONGODB_URI` value.

## Verify It's Set

```bash
heroku config:get MONGODB_URI
```

Should show your connection string (not empty).

## After Setting MONGODB_URI

1. **Restart your app:**
   ```bash
   heroku restart
   ```

2. **Check the logs:**
   ```bash
   heroku logs --tail
   ```

3. **Look for:**
   ```
   MongoDB connected successfully
   Database: poolnplay
   ```

   NOT:
   ```
   WARNING: MONGODB_URI not set
   MongoDB connection error
   ```

## Complete List of Required Variables

Make sure ALL of these are set:

```bash
heroku config:set MONGODB_URI="your-connection-string"
heroku config:set SESSION_SECRET="your-random-secret"
heroku config:set ADMIN_USERNAME="admin"
heroku config:set ADMIN_PASSWORD="your-password"
heroku config:set SMTP_HOST="smtp.gmail.com"
heroku config:set SMTP_PORT="587"
heroku config:set SMTP_USER="your-email@gmail.com"
heroku config:set SMTP_PASS="your-app-password"
heroku config:set EMAIL_TO="markagrover85@gmail.com"
```

Then restart:
```bash
heroku restart
```

## Why This Happened

The app is trying to connect to MongoDB at `127.0.0.1:27017` (localhost), which doesn't exist on Heroku. Heroku dynos don't have MongoDB installed locally - you need to use a cloud MongoDB service like MongoDB Atlas.

## Still Having Issues?

1. Check Heroku logs: `heroku logs --tail`
2. Verify MongoDB connection string is correct
3. Make sure your MongoDB Atlas IP whitelist includes `0.0.0.0/0` (allows all IPs)
4. Check that your MongoDB username/password are correct

