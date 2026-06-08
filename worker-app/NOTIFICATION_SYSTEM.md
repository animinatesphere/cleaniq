# 🔔 Mobile App Notification System

## Overview

The mobile app now has a **real-time notification system** that:

- ✅ Fetches notifications from your backend every 10 seconds
- 🔊 **Plays notification sound** like Messenger when new notifications arrive
- 📱 Shows local notifications on the phone
- 🔄 Auto-refreshes the notification screen when new notifications come in
- 📵 Properly starts/stops when user logs in/out

## Architecture

### 1. **notificationService.js** (`src/utils/`)

Core service that handles:

- **Polling**: Fetches notifications from backend periodically
- **Sound**: Plays notification sound when new notification arrives
- **Local Notifications**: Schedules local notifications with sound
- **Deduplication**: Tracks notification IDs to avoid duplicate sounds

**Key Methods**:

- `startPolling(workerId, intervalMs)` - Start fetching notifications
- `stopPolling()` - Stop polling (called on logout)
- `playNotificationSound()` - Play alert sound
- `testNotification()` - Send test notification for debugging

### 2. **NotificationContext.js** (`src/context/`)

React Context that:

- Tracks unread notification count
- Provides update triggers for screens
- Allows screens to listen for new notifications

**Key Properties**:

- `unreadCount` - Number of unread notifications
- `triggerNotificationUpdate()` - Manually trigger screen refresh
- `notificationUpdate` - Update counter (changes when notifications updated)

### 3. **useNotifications Hook** (`src/hooks/`)

Custom hook for easy access to notification features:

```javascript
const { unreadCount, triggerRefresh, notificationUpdate } = useNotifications();
```

### 4. **Integration in App.js**

- Starts notification polling when user logs in
- Stops polling when user logs out
- Wraps app with NotificationProvider

### 5. **NotificationScreen.js** (Updated)

- Auto-refreshes when new notifications arrive
- Uses NotificationContext to listen for updates
- Marks notifications as read
- Shows unread badge

## How It Works (Step by Step)

### When User Logs In:

1. ✅ App.js detects `userToken` and `workerInfo` available
2. ✅ Starts `notificationService.startPolling(workerId)`
3. ✅ Service begins polling backend every 10 seconds
4. ✅ Sound permission already requested on app launch

### When New Notification Arrives:

1. 📡 Backend sends notification to your API
2. 🔄 Polling service fetches all notifications
3. ✅ Detects new notification by ID
4. 🔊 **Plays notification sound immediately**
5. 📱 Shows local notification on phone
6. 📲 NotificationContext triggers update
7. 🔄 NotificationScreen auto-refreshes

### When User Logs Out:

1. 🛑 App.js detects `userToken` = null
2. ⛔ Calls `notificationService.stopPolling()`
3. 🗑️ Clears stored notification IDs
4. 🔇 Stops fetching and playing sounds

## Customization Options

### Change Polling Interval

**File**: `App.js` (line ~210)

```javascript
notificationService.startPolling(workerInfo.id, 5000); // 5 seconds instead of 10
```

### Sound Configuration

**File**: `src/utils/notificationService.js`

The app uses the system default notification sound. To use a custom sound file:

1. Add audio file to `assets/` folder
2. Update `playNotificationSound()` method:

```javascript
async playNotificationSound() {
  const { sound } = await Audio.Sound.createAsync(
    require('../../assets/notification-sound.mp3')
  );
  await sound.playAsync();
}
```

### Notification Content

Customize what appears in the notification:
**File**: `src/utils/notificationService.js`

```javascript
content: {
  title: notification.title || "New Notification",
  body: notification.message || "",
  // Add custom fields here
}
```

## Testing the System

### Option 1: Manual Test Notification

```javascript
// In any screen component
const { triggerRefresh } = useNotifications();

// Trigger test notification
import notificationService from "../utils/notificationService";
notificationService.testNotification();
```

### Option 2: Test from Backend

Send a notification to the worker API endpoint and you should:

- See notification sound play 🔊
- See local notification on phone
- See notification appear in NotificationScreen 📲

### Option 3: Check Logs

Monitor the terminal/console:

- `🔔 Starting notification polling...` - Polling started
- `🆕 New notification received:` - New notification detected
- `✅ Local notification scheduled with sound` - Sound playing
- `🛑 Notification polling stopped` - Polling stopped

## Troubleshooting

### ❌ No Sound Playing

1. Check phone notifications are enabled
2. Check volume is not muted
3. Check permissions granted in App.js console logs
4. Run `notificationService.testNotification()` to test

### ❌ Notifications Not Appearing

1. Check backend is sending notifications to correct worker ID
2. Check network connection in phone
3. Monitor console logs for errors
4. Verify API_URL in `AuthContext.js` is correct

### ❌ Sound Playing Too Often

1. Notifications already in database might play sound on refresh
2. This is handled by deduplication - each notification ID tracked
3. To test: restart app and send new notification

### ❌ Unread Count Not Updating

1. Clear app cache and restart
2. Check NotificationContext is properly initialized
3. Verify workerInfo is being passed to NotificationProvider

## What the User Will Experience

1. **App opens** → Background notifications polling starts
2. **New notification arrives** → 🔊 Sound plays (like Messenger)
3. **Phone vibrates** → Local notification appears
4. **Tap notification** → Opens app or goes to notification
5. **Notification Screen** → Updates automatically
6. **App closes/logs out** → Sound notifications stop

## Files Modified/Created

### Created:

- ✅ `src/utils/notificationService.js` - Core notification service
- ✅ `src/context/NotificationContext.js` - Notification context provider
- ✅ `src/hooks/useNotifications.js` - Custom hook for screens
- ✅ `NOTIFICATION_SYSTEM.md` - This documentation

### Modified:

- ✅ `App.js` - Integrated notification service and context
- ✅ `src/screens/NotificationScreen.js` - Added auto-refresh capability

## API Endpoints Required

The system expects these endpoints on your backend:

### Get Worker Notifications

```
GET /api/notifications/{workerId}
Response: Array of notification objects
{
  _id: "...",
  title: "...",
  message: "...",
  type: "info|success|warning|job",
  isRead: boolean,
  createdAt: ISO timestamp
}
```

### Mark as Read (Optional)

```
PUT /api/notifications/{notificationId}/read
PUT /api/notifications/{workerId}/read-all
```

## Performance Notes

- ⚡ Polling every 10 seconds (adjustable)
- 🔋 Low battery impact due to efficient polling
- 📊 Network-efficient with just notification fetch
- 🧠 Smart deduplication prevents duplicate sounds

## Next Steps

1. **Test the system**: Open app and send a test notification
2. **Listen for sound**: Verify notification sound plays
3. **Adjust polling interval**: If needed for your use case
4. **Customize sound**: If you want a custom notification tone

---

**System Status**: ✅ Ready to Use
**Last Updated**: 2026-06-07
**Version**: 1.0
