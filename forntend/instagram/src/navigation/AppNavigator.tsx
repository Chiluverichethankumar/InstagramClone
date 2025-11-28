// import React from 'react';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { MainTabs } from './MainTabs';
// import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
// import { FollowListModal } from '../screens/user/FollowListModal'; // <-- ADD THIS LINE

// const RootStack = createNativeStackNavigator();

// export const AppNavigator = () => (
//   <RootStack.Navigator screenOptions={{ headerShown: false }}>
//     <RootStack.Screen name="MainTabs" component={MainTabs} />
//     <RootStack.Screen name="UserProfile" component={UserProfileScreen} />
//     {/* Register the modal here so EVERYWHERE in the app can open it */}
//     <RootStack.Screen
//       name="FollowListModal"
//       component={FollowListModal}
//       options={{ presentation: 'modal', headerShown: true, title: 'Followers / Following' }}
//     />
//   </RootStack.Navigator>
// );


// D:\Projects\InstagramApp\Codes\forntend\instagram\src\navigation\AppNavigator.tsx

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';

// 🔹 New Import: Import the screen component you just created
import { FollowersListScreen } from '../screens/profile/FollowersListScreen'; 

const RootStack = createNativeStackNavigator();

export const AppNavigator = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="MainTabs" component={MainTabs} />
    
    {/* 🔸 The standard user profile screen you navigate to */}
    <RootStack.Screen name="UserProfile" component={UserProfileScreen} />

    {/* 🔹 Follower/Following List Modal - Using the name expected by MyProfileScreen.tsx */}
    <RootStack.Screen
      name="FollowersList" // Renamed from FollowListModal/FollowListModal 
      component={FollowersListScreen} // Mapped to the new component
      options={{
        presentation: 'modal',
        headerShown: true,
        title: '',
        headerStyle: { backgroundColor: '#fff' },
        headerTitleAlign: 'center',
      }}
    />
  </RootStack.Navigator>
);