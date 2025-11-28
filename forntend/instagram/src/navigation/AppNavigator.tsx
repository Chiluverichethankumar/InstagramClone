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
import { FollowersListScreen } from '../screens/profile/FollowersListScreen'; 

// 🌟 NEW IMPORT
import { EditProfileScreen } from '../screens/profile/EditProfileScreen'; 

const RootStack = createNativeStackNavigator();

export const AppNavigator = () => (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen name="UserProfile" component={UserProfileScreen} />
        
        {/* 🌟 NEW SCREEN */}
        <RootStack.Screen name="EditProfile" component={EditProfileScreen} />

        {/* MODAL */}
        <RootStack.Screen
            name="FollowersList" 
            component={FollowersListScreen}
            options={{
                presentation: 'modal',
                headerShown: true,
                title: '',
                // ... (rest of modal options)
            }}
        />
    </RootStack.Navigator>
);