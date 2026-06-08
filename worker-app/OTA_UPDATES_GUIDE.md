# 🚀 OTA Updates Setup Guide

**OTA (Over-The-Air) Updates** allow workers to receive app updates without redownloading from the app store. They just restart the app!

---

## ✅ Setup Instructions

### **1. Install EAS CLI (One-time)**

```bash
npm install -g eas-cli
```

### **2. Login to Expo/EAS**

```bash
cd c:\Users\HP\cleaniq\worker-app
eas login
```

- Use your Expo account credentials
- Create one at https://expo.dev if needed

### **3. Link Your Project**

Your project is already configured with:

- **Expo Account**: hexcode
- **Project Name**: cleaniq-worker
- **Project ID**: c1e50a75-2559-4534-a471-6e975bdeccbc

To link it to EAS CLI:

```bash
eas project:init --id c1e50a75-2559-4534-a471-6e975bdeccbc
```

Or simply:

```bash
eas project:init
```

EAS will automatically detect your existing `projectId` from `app.json`.

### **4. Update `app.json` ✅ ALREADY DONE**

Your `app.json` is already configured with:

```json
{
  "expo": {
    "name": "Cleaniq",
    "slug": "cleaniq-worker",
    "extra": {
      "eas": {
        "projectId": "c1e50a75-2559-4534-a471-6e975bdeccbc"
      }
    },
    "updates": {
      "url": "https://u.expo.dev/c1e50a75-2559-4534-a471-6e975bdeccbc",
      "enabled": true,
      "checkAutomatically": "ON_LOAD"
    }
  }
}
```

This means OTA updates are **ready to go**! ✅

### **5. Generate Code Signing Certificate**

```bash
eas update:configure
```

This creates certificates for secure updates.

---

## 📤 Publishing Updates

### **When you make code changes:**

```bash
# 1. Update your code (e.g., fix bugs, add features)
# 2. Commit changes to git
git add .
git commit -m "Add withdrawal feature"

# 3. Publish the update
eas update --branch production --message "Added wallet withdrawal system"
```

### **What happens next:**

1. ✅ Your changes are uploaded to Expo servers
2. ✅ Workers' apps automatically check for updates (every 30 mins or on app restart)
3. ✅ New code downloads silently in the background
4. ✅ Next time they restart the app, they see the new features!

---

## 🔄 Update Frequency

- **Default**: Checks for updates every 30 minutes
- **Manual**: Workers can force refresh by closing and reopening the app
- **On Launch**: Always checks for updates when app starts

---

## 📝 Update Channels

Create different channels for different environments:

```bash
# Production channel (for all workers)
eas update --branch production --message "Stable release"

# Staging/Testing channel (test before rolling out)
eas update --branch staging --message "Testing new features"

# Worker-specific testing
eas update --branch worker-beta --message "Beta features"
```

---

## 🎯 Best Practices

### ✅ DO:

- Test changes locally first with `npm start`
- Write meaningful update messages
- Use version numbers in messages
- Test on different devices before publishing
- Monitor for user feedback after updates

### ❌ DON'T:

- Publish untested code
- Make breaking changes without warning
- Publish too frequently (multiple per day)
- Change sensitive backend logic via OTA (use API instead)

---

## 📊 Monitoring Updates

```bash
# View update history
eas update:list

# View specific update details
eas update:view <UPDATE_ID>

# Monitor rollout percentage
eas update:rollout --input <UPDATE_ID> --percentage 50
```

---

## ⚡ For This Withdrawal Feature

Now that you've added the withdrawal system, publish it:

```bash
cd c:\Users\HP\cleaniq\worker-app
eas update --branch production --message "v1.1.0: Added wallet & withdrawal system"
```

All connected workers will automatically get the new Wallet tab and Payment section! 🎉

---

## 🆘 Troubleshooting

**Update not appearing?**

- Force close the app (swipe from recents)
- Reopen the app
- Wait a few seconds for the update to download
- Check Expo dashboard for errors

**Want to rollback?**

```bash
eas update:republish --group <UPDATE_ID>
```

**Check update status:**

```bash
eas update:list --branch production --limit 10
```

---

## 🔗 Useful Links

- Expo Updates Docs: https://docs.expo.dev/eas-update/getting-started/
- EAS CLI Docs: https://docs.expo.dev/eas-cli/intro/
- Troubleshooting: https://docs.expo.dev/eas-update/debug/
