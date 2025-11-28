// import React, { useEffect, useState } from 'react';
// import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
// import { useRoute, useNavigation } from '@react-navigation/native';
// import {
//   useGetUserProfileByUsernameQuery,
//   useGetFollowersQuery,
//   useGetFollowingQuery,
//   useFollowUserMutation,
//   useUnfollowUserMutation,
// } from '../../store/api/services';
// import { Loading } from '../../components/common/Loading';
// import { useAppTheme } from '../../theme/ThemeContext';

// type FollowState = 'not-following' | 'following' | 'pending';

// export const UserProfileScreen: React.FC = () => {
//   const { theme } = useAppTheme();
//   const navigation = useNavigation<any>();
//   const route = useRoute<any>();
//   const username: string | undefined = route.params?.username;

//   const {
//     data: profile,
//     isLoading,
//     isError,
//   } = useGetUserProfileByUsernameQuery(username as string, { skip: !username });

//   // backend profile: { id: 2, user: { id: 7, ... } }
//   const userId: number | undefined = profile?.user?.id;

//   const { data: followers = [] } = useGetFollowersQuery(userId!, { skip: !userId });
//   const { data: following = [] } = useGetFollowingQuery(userId!, { skip: !userId });

//   const [followUser, { isLoading: followLoading }] = useFollowUserMutation();
//   const [unfollowUser, { isLoading: unfollowLoading }] = useUnfollowUserMutation();

//   const [followState, setFollowState] = useState<FollowState>('not-following');

//   useEffect(() => {
//     if (!profile) return;

//     if (profile.is_following) {
//       setFollowState('following');
//     } else if (profile.request_sent) {
//       setFollowState('pending');
//     } else {
//       setFollowState('not-following');
//     }
//   }, [profile]);

//   if (!username) return <Text>No username provided!</Text>;
//   if (isLoading || (!profile && !isError)) return <Loading />;
//   if (isError || !profile) {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.errorText}>No data for this user</Text>
//       </View>
//     );
//   }

//   const displayUsername =
//     profile.user?.username || profile.username || username || '';

//   const handleFollowPress = async () => {
//     if (!userId) {
//       Alert.alert('Error', 'Cannot follow: invalid user id');
//       return;
//     }

//     try {
//       const res: any = await followUser(userId).unwrap();
//       console.log('followUser response:', res);

//       if (profile.is_private) {
//         // Private account → any 200 means treat as "Requested"
//         setFollowState('pending');
//       } else {
//         // Public account
//         setFollowState('following');
//       }
//     } catch (e: any) {
//       console.log('followUser error:', e);
//       const msg =
//         e?.data?.error || e?.data?.message || e?.message || 'Action failed';
//       Alert.alert('Error', msg);
//     }
//   };

//   const handleUnfollowPress = async () => {
//     if (!userId) {
//       Alert.alert('Error', 'Cannot unfollow: invalid user id');
//       return;
//     }

//     try {
//       const res: any = await unfollowUser(userId).unwrap();
//       console.log('unfollowUser response:', res);
//       setFollowState('not-following');
//     } catch (e: any) {
//       console.log('unfollowUser error:', e);
//       const msg =
//         e?.data?.error || e?.data?.message || e?.message || 'Unfollow failed';
//       Alert.alert('Error', msg);
//     }
//   };

//   let followButton = null;
//   if (followState === 'following') {
//     followButton = (
//       <TouchableOpacity
//         onPress={handleUnfollowPress}
//         style={styles.unfollowButton}
//         disabled={unfollowLoading}
//       >
//         <Text style={styles.unfollowText}>Unfollow</Text>
//       </TouchableOpacity>
//     );
//   } else if (followState === 'pending') {
//     followButton = (
//       <View style={styles.requestedButton}>
//         <Text style={styles.requestedText}>Requested</Text>
//       </View>
//     );
//   } else {
//     followButton = (
//       <TouchableOpacity
//         onPress={handleFollowPress}
//         style={styles.followButton}
//         disabled={followLoading}
//       >
//         <Text style={styles.followText}>
//           {profile.is_private ? 'Request' : 'Follow'}
//         </Text>
//       </TouchableOpacity>
//     );
//   }

//   return (
//     <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
//       <View style={styles.header}>
//         <View style={styles.headerRow}>
//           {profile.profile_pic ? (
//             <Image source={{ uri: profile.profile_pic }} style={styles.avatar} />
//           ) : (
//             <View style={styles.avatarPlaceholder}>
//               <Text style={styles.avatarText}>
//                 {displayUsername.charAt(0).toUpperCase()}
//               </Text>
//             </View>
//           )}

//           <TouchableOpacity
//             onPress={() =>
//               navigation.navigate('FollowListModal', { userId, type: 'followers' })
//             }
//             style={styles.countBox}
//           >
//             <Text style={styles.countNum}>{followers.length}</Text>
//             <Text style={styles.countLabel}>Followers</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={() =>
//               navigation.navigate('FollowListModal', { userId, type: 'following' })
//             }
//             style={styles.countBox}
//           >
//             <Text style={styles.countNum}>{following.length}</Text>
//             <Text style={styles.countLabel}>Following</Text>
//           </TouchableOpacity>
//         </View>

//         <Text style={styles.username}>@{displayUsername}</Text>
//         {profile.full_name ? <Text style={styles.fullName}>{profile.full_name}</Text> : null}
//         {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
//         {followButton}
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e6e6e6' },
//   headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
//   avatar: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     marginRight: 16,
//     borderWidth: 1,
//     borderColor: '#eee',
//   },
//   avatarPlaceholder: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#67a4ec',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 16,
//   },
//   avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
//   username: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
//   fullName: { fontSize: 16, color: '#666', marginBottom: 2 },
//   bio: { fontSize: 14, color: '#444', marginTop: 4, marginBottom: 12 },
//   countBox: { alignItems: 'center', marginHorizontal: 10 },
//   countNum: { fontSize: 18, fontWeight: 'bold' },
//   countLabel: { fontSize: 13, color: '#888' },

//   followButton: {
//     marginTop: 8,
//     backgroundColor: '#3897f0',
//     borderRadius: 4,
//     paddingVertical: 7,
//     alignItems: 'center',
//   },
//   followText: { color: '#fff', fontWeight: '600', fontSize: 15 },

//   unfollowButton: {
//     marginTop: 8,
//     backgroundColor: '#fff',
//     borderColor: '#bbb',
//     borderWidth: 1,
//     borderRadius: 4,
//     paddingVertical: 7,
//     alignItems: 'center',
//   },
//   unfollowText: { color: '#333', fontWeight: '600', fontSize: 15 },

//   requestedButton: {
//     marginTop: 8,
//     backgroundColor: '#efefef',
//     borderRadius: 4,
//     paddingVertical: 7,
//     alignItems: 'center',
//   },
//   requestedText: { color: '#999', fontWeight: '600', fontSize: 15 },

//   errorText: { fontSize: 16, textAlign: 'center', marginTop: 24, color: 'red' },
// });

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Alert,
    Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
    useGetUserProfileByUsernameQuery,
    useFollowUserMutation,
    useUnfollowUserMutation,
} from '../../store/api/services';
import { Loading } from '../../components/common/Loading';
import { useAppTheme } from '../../theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons'; // Ensure Ionicons is imported

const { width } = Dimensions.get('window');

type FollowState = 'not-following' | 'following' | 'pending';

export const UserProfileScreen: React.FC = () => {
    const { theme } = useAppTheme();
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const username = route.params?.username as string;

    // --- Data Fetching ---
    const {
        data: profile,
        isLoading: profileLoading,
        isError: profileError,
    } = useGetUserProfileByUsernameQuery(username, { skip: !username });

    // We don't need to fetch followers/following lists here, just use the counts from 'profile'
    const userId = profile?.user?.id || profile?.id;

    const [followUser, { isLoading: followLoading }] = useFollowUserMutation();
    const [unfollowUser, { isLoading: unfollowLoading }] = useUnfollowUserMutation();
    const [followState, setFollowState] = useState<FollowState>('not-following');

    // --- Sync follow state with API data ---
    useEffect(() => {
        if (!profile) return;
        if (profile.is_following) setFollowState('following');
        else if (profile.request_sent) setFollowState('pending');
        else setFollowState('not-following');
    }, [profile]);

    // --- Error and Loading States ---
    if (!username) return <Text style={styles.errorText}>No username provided.</Text>;
    if (profileLoading) return <Loading />;
    if (profileError || !profile) return <Text style={styles.errorText}>User not found.</Text>;

    // --- Profile Data Extraction ---
    const displayUsername = profile.user?.username || profile.username || username;
    const fullName = profile.user?.full_name || profile.full_name || '';
    const bio = profile.bio || '';
    const profilePic = profile.profile_pic || profile.user?.profile_pic;

    // Use counts directly from the main profile object (assuming backend fix is applied)
    const followersCount = profile.followers_count ?? 0;
    const followingCount = profile.following_count ?? 0;
    const postsCount = profile.posts_count ?? 0; // Assuming posts_count is also available

    // --- Follow/Unfollow Logic ---
    const handleFollow = async () => {
        if (!userId) return Alert.alert('Error', 'Invalid user');
        try {
            await followUser(userId).unwrap();
            setFollowState(profile.is_private ? 'pending' : 'following');
        } catch (err: any) {
            Alert.alert('Error', err?.data?.error || 'Failed to follow');
        }
    };

    const handleUnfollow = async () => {
        if (!userId) return Alert.alert('Error', 'Invalid user');
        try {
            await unfollowUser(userId).unwrap();
            setFollowState('not-following');
        } catch (err: any) {
            Alert.alert('Error', err?.data?.error || 'Failed to unfollow');
        }
    };

    // --- Follow Button Component ---
    const FollowButton = () => {
        const loading = followLoading || unfollowLoading;
        const isOwnProfile = false; // Implement logic to check if this is the logged-in user

        if (isOwnProfile) {
             return (
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.editProfileBtn}>
                        <Text style={styles.editProfileText}>Edit Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shareProfileBtn}>
                        <Icon name="person-add-outline" size={20} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
            );
        }

        // Other User Profile buttons
        if (followState === 'following') {
            return (
                 <View style={styles.actionRow}>
                    <TouchableOpacity onPress={handleUnfollow} style={[styles.messageBtn, {borderColor: theme.colors.border}]} disabled={loading}>
                        <Text style={styles.messageText}>{loading ? 'Loading...' : 'Following'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.messageBtn, {borderColor: theme.colors.border}]}>
                        <Text style={styles.messageText}>Message</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.shareProfileBtn, {borderColor: theme.colors.border}]}>
                        <Icon name="chevron-down-outline" size={20} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
            );
        }
        if (followState === 'pending') {
            return (
                <TouchableOpacity style={styles.requestedBtn} onPress={handleUnfollow} disabled={loading}>
                    <Text style={styles.requestedText}>{loading ? 'Loading...' : 'Requested'}</Text>
                </TouchableOpacity>
            );
        }
        return (
            <TouchableOpacity onPress={handleFollow} style={styles.followBtn} disabled={loading}>
                <Text style={styles.followText}>
                    {loading ? 'Loading...' : profile.is_private ? 'Follow Request' : 'Follow'}
                </Text>
            </TouchableOpacity>
        );
    };

    // --- Header Navigation for Followers/Following ---
    const navigateToList = (listType: 'followers' | 'following') => {
        if (!userId) return;
        navigation.navigate('FollowersList', {
            userId,
            username: displayUsername,
            type: listType,
        });
    };

    return (
        <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <View style={styles.header}>
                <Text style={styles.usernameHeader}>{displayUsername}</Text>
                <View style={styles.headerRow}>
                    
                    {/* Avatar */}
                    <View>
                        {profilePic ? (
                            <Image source={{ uri: profilePic }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, {backgroundColor: theme.colors.primary}]}>
                                <Text style={styles.avatarLetter}>{displayUsername[0].toUpperCase()}</Text>
                            </View>
                        )}
                        {/* Optional: Add story ring border here */}
                    </View>

                    {/* Stats Counters */}
                    <View style={styles.statsContainer}>
                        <View style={styles.countBox}>
                            <Text style={styles.countNum}>{postsCount}</Text>
                            <Text style={styles.countLabel}>posts</Text>
                        </View>

                        <TouchableOpacity onPress={() => navigateToList('followers')} style={styles.countBox}>
                            <Text style={styles.countNum}>{followersCount}</Text>
                            <Text style={styles.countLabel}>followers</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigateToList('following')} style={styles.countBox}>
                            <Text style={styles.countNum}>{followingCount}</Text>
                            <Text style={styles.countLabel}>following</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Name and Bio Section */}
                <View style={styles.bioSection}>
                    {fullName ? <Text style={[styles.fullName, {color: theme.colors.text}]}>{fullName}</Text> : null}
                    {bio ? <Text style={[styles.bio, {color: theme.colors.text}]}>{bio}</Text> : null}
                </View>
                

                {/* ACTION BUTTON (Follow/Message/Edit) */}
                <FollowButton />
                
                {/* Placeholder for Story Highlights */}
                <View style={{height: 100, marginTop: 15}} />
                
            </View>

            {/* Separator and Post Tabs (Grid/Tagged) */}
            <View style={[styles.separator, {borderColor: theme.colors.border}]} />

            <View style={styles.tabsContainer}>
                <TouchableOpacity style={styles.tabButton}>
                    <Icon name="grid-outline" size={26} color={theme.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabButton}>
                    <Icon name="person-tag-outline" size={26} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>
            
            {/* Placeholder for Post Grid */}
            <View style={{ width: width, height: 600, backgroundColor: theme.colors.background }}>
                <Text style={[styles.errorText, {color: theme.colors.textSecondary}]}>Post Grid Placeholder</Text>
            </View>

        </ScrollView>
    );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
    header: { paddingHorizontal: 16, paddingTop: 10 },
    
    // Top Row: Username and Optional Icons (e.g., Settings, Add)
    usernameHeader: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: '#262626', // Use hardcoded black for contrast
        marginBottom: 10,
    },
    
    // Avatar and Stats Row
    headerRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 10 
    },
    avatar: { 
        width: 90, 
        height: 90, 
        borderRadius: 45, 
    },
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
    
    // Stats Container
    statsContainer: {
        flex: 1, 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        paddingLeft: 20
    },
    countBox: { alignItems: 'center' },
    countNum: { fontSize: 18, fontWeight: 'bold', color: '#262626' },
    countLabel: { fontSize: 13, color: '#666' },

    // Bio Section
    bioSection: { 
        paddingTop: 8,
        paddingBottom: 10,
    },
    fullName: { fontSize: 15, fontWeight: 'bold' },
    bio: { fontSize: 15, lineHeight: 21 },
    
    // --- Action Button Styles (Follow/Message/Edit) ---
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    followBtn: {
        flex: 1,
        backgroundColor: '#0095f6', // Instagram Blue
        paddingVertical: 7,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 5,
    },
    followText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    
    messageBtn: {
        flex: 1,
        marginRight: 6,
        backgroundColor: '#fff',
        borderWidth: 1,
        paddingVertical: 7,
        borderRadius: 6,
        alignItems: 'center',
    },
    messageText: { color: '#262626', fontWeight: '600', fontSize: 14 },
    
    editProfileBtn: {
        flex: 1,
        marginRight: 6,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#dbdbdb',
        paddingVertical: 7,
        borderRadius: 6,
        alignItems: 'center',
    },
    editProfileText: { color: '#262626', fontWeight: '600', fontSize: 14 },

    shareProfileBtn: {
        width: 40,
        height: 34, // Match message button height
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#dbdbdb',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    requestedBtn: {
        flex: 1,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#dbdbdb',
        paddingVertical: 7,
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 5,
    },
    requestedText: { color: '#262626', fontWeight: '600', fontSize: 14 },

    // --- Post Grid Tabs ---
    separator: {
        height: 1,
        backgroundColor: '#dbdbdb',
        marginVertical: 0,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#dbdbdb',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    
    // --- Utility Styles ---
    errorText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#999' },
});