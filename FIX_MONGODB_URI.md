# Fix Your MongoDB Connection String

## The Problem

Your connection string is **incorrect**:
```
mongodb+srv://mark1:MagJls2010@cluster.mongodb.net/poolnplay?retryWrites=true&w=majority
```

The error `querySrv ENOTFOUND _mongodb._tcp.cluster.mongodb.net` means the hostname `cluster.mongodb.net` doesn't exist.

## The Solution

You need to get your **actual MongoDB Atlas cluster hostname**. It should look like:
```
cluster0.xxxxx.mongodb.net
```
or
```
cluster0.sn02wf.mongodb.net
```

## How to Get the Correct Connection String

### Step 1: Go to MongoDB Atlas
1. Visit: https://cloud.mongodb.com/
2. Log in with your account

### Step 2: Get Your Connection String
1. Click on your **cluster** (or create one if you don't have one)
2. Click the **"Connect"** button
3. Choose **"Connect your application"**
4. Select **"Node.js"** as the driver
5. Copy the connection string

It should look like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
```

### Step 3: Replace Placeholders
Replace:
- `<username>` with your MongoDB username (e.g., `mark1`)
- `<password>` with your MongoDB password (e.g., `MagJls2010`)
- `<dbname>` with your database name (e.g., `poolnplay`)

**Example:**
```
mongodb+srv://mark1:MagJls2010@cluster0.sn02wf.mongodb.net/poolnplay?retryWrites=true&w=majority
```

### Step 4: Set It in Heroku
```bash
heroku config:set MONGODB_URI="mongodb+srv://mark1:MagJls2010@cluster0.YOURCLUSTER.mongodb.net/poolnplay?retryWrites=true&w=majority"
```

Replace `YOURCLUSTER` with your actual cluster identifier.

### Step 5: Restart
```bash
heroku restart
```

## Important Notes

1. **Password Special Characters**: If your password has special characters, you may need to URL-encode them:
   - `@` becomes `%40`
   - `#` becomes `%23`
   - `$` becomes `%24`
   - etc.

2. **IP Whitelist**: Make sure your MongoDB Atlas IP whitelist includes:
   - `0.0.0.0/0` (allows all IPs) - for Heroku
   - Or add Heroku's IP ranges

3. **Database User**: Make sure the database user exists and has the correct permissions.

## Verify It Works

After setting the correct connection string, check logs:
```bash
heroku logs --tail
```

You should see:
```
MongoDB connected successfully
Database: poolnplay
```

NOT:
```
MongoDB connection error: querySrv ENOTFOUND
```

## Still Having Issues?

1. **Check your cluster name in MongoDB Atlas dashboard**
2. **Verify your username and password are correct**
3. **Check IP whitelist settings**
4. **Make sure the database user has read/write permissions**

