# Firebase Setup for Live Auction Sharing

To enable live auction sharing, you need to set up a Firebase project and configure the Realtime Database.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "player-auction-app")
4. Disable Google Analytics (optional for this use case)
5. Click "Create project"

## Step 2: Enable Realtime Database

1. In your Firebase project, go to "Realtime Database" in the left sidebar
2. Click "Create Database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. Click "Done"

## Step 3: Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>) to add a web app
4. Enter app nickname (e.g., "auction-app")
5. Don't check "Firebase Hosting" for now
6. Click "Register app"
7. Copy the configuration object

## Step 4: Update Configuration

Replace the placeholder values in `src/config/firebase.ts` with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-actual-app-id"
};
```

## Step 5: Database Rules (Optional)

For production, you may want to set up proper security rules. Go to "Realtime Database" > "Rules" and update:

```json
{
  "rules": {
    "shared-auctions": {
      ".read": true,
      ".write": true,
      "$auctionId": {
        ".validate": "newData.hasChildren(['tournament', 'auctionState', 'isActive'])"
      }
    }
  }
}
```

## Step 6: Test the Setup

1. Start your development server: `npm run dev`
2. Create a tournament and start an auction
3. Click "Share Live" button
4. Copy the generated link and open it in another browser/tab
5. You should see the auction updating in real-time!

## Troubleshooting

### Common Issues:

1. **"Firebase not configured"**: Make sure you've updated the config in `firebase.ts`
2. **"Permission denied"**: Check your database rules allow read/write access
3. **"Database URL not found"**: Ensure you've created a Realtime Database (not Firestore)

### Free Tier Limits:

- **Storage**: 1 GB
- **Data Transfer**: 10 GB/month
- **Concurrent Connections**: 100 users

This should be more than enough for most auction use cases!

## Security Notes

- The current setup uses test mode for simplicity
- For production, implement proper authentication and security rules
- Consider adding user authentication for better control
- Monitor usage in Firebase Console to stay within free limits

## Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Firebase configuration
3. Ensure Realtime Database is enabled (not just Firestore)
4. Test with a simple auction first
