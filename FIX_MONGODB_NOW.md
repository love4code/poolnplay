# ⚠️ URGENT: Fix Your MongoDB Connection String

## The Problem

Your `MONGODB_URI` contains a placeholder:
```
mongodb+srv://mark1:MagJls2010@cluster0.YOURCLUSTER.mongodb.net/poolnplay?retryWrites=true&w=majority
```

**`YOURCLUSTER` needs to be replaced with your actual MongoDB Atlas cluster name!**

This is causing:
- Session saves to fail
- Admin login to not work
- App to crash

## Quick Fix - Use Memory Store (Temporary)

Until you fix MongoDB, you can remove the invalid MONGODB_URI so sessions use memory store:

```bash
heroku config:unset MONGODB_URI
heroku restart
```

**Note:** Sessions will be lost on app restart, but login will work.

## Permanent Fix - Get Real MongoDB Connection String

### Step 1: Go to MongoDB Atlas
1. Visit: https://cloud.mongodb.com/
2. Log in

### Step 2: Get Your Cluster Name
1. Click on your **cluster**
2. Look at the cluster name - it should be something like:
   - `Cluster0`
   - `cluster0`
   - Or check the connection string

### Step 3: Get Connection String
1. Click **"Connect"** button on your cluster
2. Choose **"Connect your application"**
3. Select **"Node.js"** driver
4. Copy the connection string

It should look like:
```
mongodb+srv://mark1:MagJls2010@cluster0.xxxxx.mongodb.net/poolnplay?retryWrites=true&w=majority
```

Where `xxxxx` is your actual cluster identifier (like `sn02wf` or similar).

### Step 4: Set It in Heroku
```bash
heroku config:set MONGODB_URI="mongodb+srv://mark1:MagJls2010@cluster0.xxxxx.mongodb.net/poolnplay?retryWrites=true&w=majority"
```

Replace `xxxxx` with your actual cluster identifier.

### Step 5: Restart
```bash
heroku restart
```

### Step 6: Verify
```bash
heroku logs --tail
```

Look for:
```
Session store connected to MongoDB
MongoDB connected successfully
```

NOT:
```
querySrv ENOTFOUND _mongodb._tcp.cluster0.YOURCLUSTER.mongodb.net
```

## What Your Connection String Should Look Like

**Valid examples:**
- `mongodb+srv://user:pass@cluster0.sn02wf.mongodb.net/dbname`
- `mongodb+srv://user:pass@cluster0.abc123.mongodb.net/dbname`

**Invalid (what you have now):**
- `mongodb+srv://user:pass@cluster0.YOURCLUSTER.mongodb.net/dbname` ❌
- `mongodb+srv://user:pass@cluster.mongodb.net/dbname` ❌

## After Fixing

1. Admin login should work
2. Sessions will persist in MongoDB
3. All database operations will work

