npx --ignore-existing @react-native-community/cli init Instagram

# 1. CLEANUP: Delete the conflicting lock file (package-lock.json)
del package-lock.json

# 2. CLEANUP: Delete the partial node_modules folder
rmdir /s /q node_modules

# 3. INSTALLATION: Install ALL required dependencies

A. Core Libraries
npm install @react-navigation/native @react-navigation/stack react-native-screens react-native-safe-area-context
npm install @reduxjs/toolkit react-redux redux-persist
npm install nativewind tailwind-rn
npm install axios

B. Linking Libraries
npm install @react-native-async-storage/async-storage
npm install react-native-image-picker
npm install react-native-maps
npm install react-native-vector-icons

C. TypeScript Types (Development Dependencies)

npm install --save-dev @types/react-native-vector-icons @types/react-native-maps @types/tailwindcss




InstagramClone/
├─ App.tsx                            # App 
├─ tailwind.json
entry point
├─ babel.config.js                   # React Native babel config
├─ Gemfile                         # Ruby Gemfile (if any)
├─ index.js                         # React Native CLI index entry
├─ package.json                    # npm dependencies and scripts
├─ src/
│  ├─ api/
│  │  ├─ axiosInstance.ts          # Axios instance + session interceptor
│  │  └─ services.ts               # RTK Query API endpoints/hooks
│  ├─ assets/
│  │  ├─ lotties/
│  │  │  └─ heart-burst.json      # Lottie animation JSON for like burst
│  │  ├─ icons/                   # Additional custom icons (if any)
│  │  └─ images/                  # Any other media assets
│  ├─ components/
│  │  ├─ PostCard.tsx             # Posts display with double tap animation
│  │  ├─ LikeButton.tsx           # Like button component with 
│  │  ├─ HeartBurst.tsx
animation
│  │  ├─ StoryCircle.tsx          # Story circle ring UI
│  │  ├─ StoryViewer.tsx          # Story full screen swipe viewer + reply
│  │  └─ Comment.tsx
|  |   |--MessageBubble.tsx
│  ├─ hooks/
│  │  ├─ useAuth.ts               # Auth hook managing login/signup/logout
│  │  ├─ useSessionInterceptor.ts # Global Axios interceptor hook
│  │  └─ ... other hooks
│  ├─ navigation/
│  │  ├─ AppNavigator.tsx         # Root navigator (Auth vs Main)
│  │  ├─ AuthNavigator.tsx        # Auth flow stack navigator
│  │  └─ MainTabNavigator.tsx     # Bottom tab main navigator
│  ├─ redux/
│  │  ├─ slices/
│  │  │  ├─ authSlice.ts
│  │  │  ├─ postsSlice.ts
│  │  │  ├─ storiesSlice.ts
│  │  │  ├─ messagesSlice.ts
│  │  │  └─ uiSlice.ts
│  │  └─ store.ts
│  ├─ screens/
│  │  ├─ Auth/
│  │  │  ├─ LoginScreen.tsx
│  │  │  └─ SignupScreen.tsx
│  │  ├─ ChatScreen.tsx
│  │  ├─ CreatePostScreen.tsx
│  │  ├─ ExploreScreen.tsx         
│  │  ├─ FeedScreen.tsx
│  │  ├─ FriendRequestsScreen.tsx
│  │  ├─ FollowersFollowingScreen.tsx
│  │  ├─ MessagesListScreen.tsx
│  │  ├─ PostScreen.tsx            
│  │  ├─ ProfileScreen.tsx
│  │  ├─ ReelsScreen.tsx
│  │  |--StoryViewer.tsx
│  │  |--PostCard.tsx
│  │  
│  ├─ services/
│  │  ├─ sessionService.ts         # Session save/get/clear from AsyncStorage
│  │  └─ uploadService.ts          # Helpers to create form data for uploads
│  ├─ utils/
│  │  ├─ constants.ts
│  │  └─ formatTime.ts
│  └─ types/
│     └─ index.ts                  # App-wide TypeScript interfaces/types



INSTAGRAM CLONE MOBILE APP

Welcome to the documentation for the Instagram Clone, a modern mobile application built using React Native and TypeScript, utilizing the power of Redux Toolkit and RTK Query for state management and API handling.

GETTING STARTED

Follow these steps to set up and run the project locally on your development machine.

Project Initialization

The project was created using the specific React Native CLI command below. This command defaults to using the modern TypeScript template:

1. Create the project directory and initialize the structure

npx @react-native-community/cli@latest init InstagramClone

2. Navigate into the new project directory

cd InstagramClone

Required Tools

Before starting, ensure you have the following installed and configured:

Node.js (LTS version recommended)

Yarn or npm (Yarn is generally preferred for dependency management)

Java Development Kit (JDK)

Android Studio (for Android development)

Xcode & CocoaPods (for iOS development on macOS)

React Native CLI (used via npx during initialization)

Installation of Dependencies

This project relies on a modern stack for networking, navigation, and styling.

A. Core Libraries

Install the fundamental libraries for navigation, state management, and styling:

1. Navigation (React Navigation)

yarn add @react-navigation/native @react-navigation/stack react-native-screens react-native-safe-area-context

2. State Management (Redux Toolkit and Persistence)

yarn add @reduxjs/toolkit react-redux redux-persist

3. Styling (NativeWind/Tailwind CSS)

yarn add nativewind tailwind-rn

4. Networking (Axios)

yarn add axios

B. Linking & Other Dependencies

These libraries involve native code and require linking (usually automatic).

Async Storage (required for Redux Persist)

yarn add @react-native-async-storage/async-storage

Media/Camera Access

yarn add react-native-image-picker

Maps (optional but included for LocationPickerScreen)

yarn add react-native-maps

Vector Icons (used by the custom Icon.tsx component)

yarn add react-native-vector-icons

C. Install TypeScript Types

For certain libraries, explicitly install their TypeScript definition packages:

yarn add -D @types/react-native-vector-icons @types/react-native-maps

Running the Application

A. Crucial Android Build Fix (Gradle Update)

Due to frequent compatibility issues, the Gradle wrapper configuration should be updated to ensure a smooth build process.

Open the file: android/gradle/wrapper/gradle-wrapper.properties

Ensure the distributionUrl matches the following line:

distributionUrl=https://www.google.com/search?q=https://services.gradle.org/distributions/gradle-8.13-bin.zip

B. iOS Specific (Mandatory on macOS)

If targeting iOS, you must install the native dependencies:

cd ios
pod install
cd ..

C. Launch Commands

After installing all dependencies and making the Gradle fix, you can launch the app:

Platform

Command

Notes

Android

yarn android

Requires an Android emulator running or a device connected.

iOS

yarn ios

Requires a macOS machine and Xcode.

KEY TECHNOLOGIES AND ARCHITECTURE

The application is structured using a robust pattern focusing on separation of concerns.

State Management: Redux Toolkit (RTK) & Persist

Core State: Managed by Redux Toolkit for predictable data flow.

Data Fetching: RTK Query is used via src/api/services.ts to define API endpoints, simplifying data caching, loading states, and error handling.

Persistence: redux-persist ensures the user's authentication token and session state persist across app launches.

Navigation & Routing

The application utilizes a multi-layered navigation system:

RootNavigator.tsx: Switches the main view between the authenticated state (Main Tabs) and the unauthenticated state (Auth Stack).

MainTabNavigator.tsx: Defines the five main tabs at the bottom of the screen.

Styling

NativeWind / Tailwind CSS: All UI styling is done using Tailwind utility classes directly in the JSX/TSX. This allows for responsive and highly maintainable styling without custom CSS files.

MINIMAL CODE CHECKLIST

These files are the absolute minimum required to establish the Redux and Navigation skeleton:

File

Core Responsibility

Key Code Structure

src/types/index.ts

Defines all data structure interfaces (IUser, IPost).

export interface IUser { ... }

src/redux/store.ts

Initializes the global Redux store.

export const store = configureStore(...)

src/navigation/types.ts

Defines all TypeScript types for navigation routes.

export type RootStackParamList = { ... }

src/navigation/RootNavigator.tsx

Contains the main navigation switch.

<Stack.Navigator> logic switching between AuthNavigator and MainTabNavigator.

App.tsx

The application wrapper.

<Provider store={store}><PersistGate ...><ThemeProvider><RootNavigator /></ThemeProvider></PersistGate></Provider>





Top Level
├── android/ # Native Android project
├── ios/ # Native iOS project
├── node_modules/ # Dependencies
├── app.json # App config
├── App.tsx # Root component
├── babel.config.js # Babel config
├── index.js # Entry point
├── metro.config.js # Metro bundler config
├── jest.config.js # Jest testing config
└── src/ # All app code & assets
    ├── assets/ # Static assets
    │ └── avatar-placeholder.png
    │
    ├── components/ # Reusable UI components
    │ ├── common/ # Shared UI (buttons, inputs, loaders)
    │ └── posts/ # PostCard, PostList, etc.
    │
    ├── hooks/ # Custom hooks
    │ └── useAuth.ts
    │
    ├── navigation/ # Navigation setup
    │ ├── AppNavigator.tsx # Decides AuthStack vs MainTabs
    │ ├── AuthStack.tsx
    │ ├── HomeStack.tsx
    │ ├── SettingsStack.tsx
    │ └── ProfileStack.tsx
    │
    ├── screens/ # Feature screens
    │ ├── auth/
    │ │ ├── LoginScreen.tsx
    │ │ └── SignupScreen.tsx
    │ │
    │ ├── home/
    │ │ └── HomeScreen.tsx
    │ │
    │ ├── notifications/
    │ │ ├── FriendsScreen.tsx
    │ │ └── NotificationsTab.tsx
    │ │
    │ ├── profile/
    │ │ ├── MyProfileScreen.tsx
    │ │ ├── ProfileScreen.tsx
    │ │ ├── UserProfileScreen.tsx
    │ │ └── ProfileStack.tsx
    │ │ └── _components/
    │ │ └── AvatarHeader.tsx
    │ │
    │ ├── settings/
    │ │ ├── SettingsScreen.tsx
    │ │ └── AccountPrivacyScreen.tsx
    │ │
    │ └── user/
    │ ├── UserSearchScreen.tsx
    │ └── FollowListModal.tsx
    │
    ├── store/ # State management
    │ ├── api/
    │ │ └── services.ts # RTK Query endpoints
    │ └── store.ts # Redux store setup
    │
    ├── theme/ # Theming
    │ ├── theme.ts # Colors, spacing, typography
    │ └── ThemeContext.tsx # Theme provider/hook
    │
    └── types/ # Global TypeScript types
        └── index.ts # User, Post, AuthResponse, Navigation params, etc.