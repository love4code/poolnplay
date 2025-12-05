# Troubleshooting Admin Login on Heroku

## Common Issues and Solutions

### 1. Admin Username/Password Not Working

#### Check Environment Variables in Heroku:

1. **Via Heroku Dashboard:**
   - Go to your app → Settings → Config Vars
   - Verify these are set:
     - `ADMIN_USERNAME` (should match what you're typing)
     - `ADMIN_PASSWORD` (should match what you're typing)

2. **Via Heroku CLI:**
   ```bash
   heroku config:get ADMIN_USERNAME
   heroku config:get ADMIN_PASSWORD
   ```

#### Common Problems:

**Problem:** Extra spaces or quotes in environment variables
- **Solution:** Make sure there are NO quotes or spaces around the values
  - ❌ Wrong: `ADMIN_USERNAME="admin"` or `ADMIN_USERNAME= admin `
  - ✅ Correct: `ADMIN_USERNAME=admin`

**Problem:** Variables not set
- **Solution:** Set them:
  ```bash
  heroku config:set ADMIN_USERNAME=admin
  heroku config:set ADMIN_PASSWORD=yourpassword
  ```

**Problem:** Case sensitivity
- **Solution:** Username and password are case-sensitive. Make sure you're typing exactly what's in the config vars.

**Problem:** Session not saving
- **Solution:** Check that `SESSION_SECRET` is set:
  ```bash
  heroku config:set SESSION_SECRET=your-random-secret-string
  ```

#### Test Your Configuration:

1. **Check Heroku logs:**
   ```bash
   heroku logs --tail
   ```
   Then try to login and see if there are any errors.

2. **Restart the app:**
   ```bash
   heroku restart
   ```
   Environment variable changes require a restart.

3. **Verify MongoDB connection:**
   - If MongoDB isn't connected, sessions might not work
   - Check that `MONGODB_URI` is set correctly

### 2. Session Issues

If you can login but get logged out immediately:

1. **Check SESSION_SECRET:**
   ```bash
   heroku config:get SESSION_SECRET
   ```
   - Must be set
   - Should be a long random string (at least 32 characters)

2. **Check MongoDB connection:**
   - Sessions are stored in MongoDB
   - If MongoDB isn't connected, sessions won't persist
   - Verify `MONGODB_URI` is correct

3. **Check cookie settings:**
   - In production, cookies use `secure: true`
   - Make sure you're accessing via HTTPS (Heroku provides this automatically)

### 3. Quick Fix Steps

1. **Set/Reset Admin Credentials:**
   ```bash
   heroku config:set ADMIN_USERNAME=admin
   heroku config:set ADMIN_PASSWORD=YourNewPassword123
   heroku restart
   ```

2. **Set/Reset Session Secret:**
   ```bash
   # Generate a random secret
   openssl rand -hex 32
   # Then set it
   heroku config:set SESSION_SECRET=the-generated-secret
   heroku restart
   ```

3. **Verify All Required Variables:**
   ```bash
   heroku config
   ```
   Should show:
   - `MONGODB_URI`
   - `SESSION_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_TO`

### 4. Debug Mode (Development Only)

If you're testing locally, the login function will log debug information to help troubleshoot. Check your local console/logs.

### 5. Still Not Working?

1. **Check Heroku logs for errors:**
   ```bash
   heroku logs --tail
   ```

2. **Try clearing your browser cookies** for the Heroku site

3. **Try a different browser** or incognito mode

4. **Verify the login route is working:**
   - Visit: `https://your-app.herokuapp.com/admin/login`
   - Should show the login form

5. **Check if MongoDB is connected:**
   - Look in Heroku logs for "MongoDB connected successfully"
   - If you see "MongoDB connection error", fix your `MONGODB_URI`

## Example: Setting Up Admin Credentials

```bash
# Set username
heroku config:set ADMIN_USERNAME=admin

# Set password (use a strong password!)
heroku config:set ADMIN_PASSWORD=MySecurePassword123!

# Set session secret (generate a random one)
heroku config:set SESSION_SECRET=$(openssl rand -hex 32)

# Restart app
heroku restart

# Verify
heroku config:get ADMIN_USERNAME
heroku config:get ADMIN_PASSWORD
```

## Security Note

- Never commit `.env` files to git
- Use strong passwords for production
- Consider using Heroku's config vars instead of hardcoding
- Rotate `SESSION_SECRET` periodically

