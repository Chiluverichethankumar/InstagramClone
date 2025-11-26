npx @react-native-community/cli init Instagram

Instagram Clone Walkthrough
I have generated the complete codebase for your Instagram Clone App. Here is a summary of what has been built and how to verify it.

📱 Features Implemented
Authentication
Login & Signup: Fully functional screens connected to the API.
Session Management: Uses AsyncStorage and Redux to persist sessions.
Home Feed
Posts: Displays images and videos with likes, comments, and captions.
Stories: Horizontal list of stories with a dedicated full-screen viewer.
Interactions: Like posts, view comments (placeholder), and view user profiles.
Create Content
Create Post: Select images/videos from the gallery, add a caption, and tag a location.
Create Story: Capture or select media for 24h stories.
Explore & Maps
Search: Find users by username.
Map View: See posts pinned on a Google Map based on their location tags.
Reels
Vertical Feed: Full-screen vertical video feed with auto-play.
Chat
Real-time Messaging: Chat list and individual chat screens with polling for new messages.
Profile
User Profile: Grid view of posts, follower counts, and bio.
Edit Profile: Update profile details.
🛠 Verification Steps
Install Dependencies: Ensure you have all required packages installed:

npm install @reduxjs/toolkit react-redux @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context react-native-svg nativewind tailwindcss react-native-reanimated react-native-gesture-handler react-native-maps react-native-fast-image @react-native-async-storage/async-storage axios react-native-vector-icons react-native-video react-native-image-picker
Run the App:

npx react-native run-android
# or
npx react-native run-ios
Test Flow:

Sign Up: Create a new account.
Create Post: Upload a photo with a location "San Francisco".
Map: Go to the Explore tab -> Map and verify the pin appears.
Feed: Check if your new post appears in the feed.
Chat: Send a message to another user (you may need to create a second account).
⚠️ Important Notes
Google Maps API Key: You MUST replace YOUR_GOOGLE_MAPS_API_KEY in 
android/app/src/main/AndroidManifest.xml
 with your actual Google Maps API Key for the map to work.
Permissions: I have added the necessary permissions to 
AndroidManifest.xml
 and 
Info.plist
.
Video: react-native-video is installed and linked.
Running:
Start Metro: npx react-native start
Run Android: npx react-native run-android
Run iOS: npx react-native run-ios