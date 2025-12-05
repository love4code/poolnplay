# Fix Admin Login on Heroku

## Quick Check

Run these commands to verify your environment variables:

```bash
heroku config:get ADMIN_USERNAME
heroku config:get ADMIN_PASSWORD
heroku config:get SESSION_SECRET
```

## Common Issues

### 1. SESSION_SECRET Not Set (MOST COMMON)

**Problem:** Sessions won't work without SESSION_SECRET.

**Fix:**
```bash
# Generate a random secret
openssl rand -hex 32

# Set it in Heroku
heroku config:set SESSION_SECRET="the-generated-secret-from-above"

# Restart
heroku restart
```

### 2. Credentials Don't Match

**Check:**
```bash
heroku config:get ADMIN_USERNAME
heroku config:get ADMIN_PASSWORD
```

Make sure you're typing **exactly** what's set (case-sensitive, no extra spaces).

### 3. Session Not Saving

If SESSION_SECRET is set but sessions still don't work:

1. **Check Heroku logs during login:**
   ```bash
   heroku logs --tail
   ```
   Then try to login and watch for errors.

2. **Clear your browser cookies** for the Heroku site

3. **Try incognito/private browsing mode**

## Step-by-Step Fix

### Step 1: Set All Required Variables

```bash
# Set admin credentials
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=YourSecurePassword123

# Generate and set session secret
heroku config:set SESSION_SECRET=$(openssl rand -hex 32)

# Verify they're set
heroku config:get ADMIN_USERNAME
heroku config:get ADMIN_PASSWORD
heroku config:get SESSION_SECRET
```

### Step 2: Restart App

```bash
heroku restart
```

### Step 3: Test Login

1. Go to: `https://your-app.herokuapp.com/admin/login`
2. Enter username: `admin` (or whatever you set)
3. Enter password: `YourSecurePassword123` (or whatever you set)
4. Click Login

### Step 4: Check Logs

```bash
heroku logs --tail
```

Look for:
- `=== LOGIN ATTEMPT ===`
- `Login successful! Session saved.`
- Any error messages

## Debugging

The login function now logs detailed information. Check Heroku logs:

```bash
heroku logs --tail | grep -i login
```

You should see:
- Provided username
- Expected username
- Whether they match
- Password length info
- Whether password matches
- Whether SESSION_SECRET is set

## Still Not Working?

1. **Verify all config vars:**
   ```bash
   heroku config
   ```

2. **Check for typos** - username and password are case-sensitive

3. **Try a different browser** or clear cookies

4. **Check if MongoDB is connected** - sessions might need MongoDB (though we have memory fallback)

5. **Look at full logs:**
   ```bash
   heroku logs --tail
   ```

## Expected Behavior

After successful login:
- You should be redirected to `/admin`
- You should see the admin dashboard
- You should stay logged in (session persists)

If you get redirected back to login, the session isn't saving properly - check SESSION_SECRET.

