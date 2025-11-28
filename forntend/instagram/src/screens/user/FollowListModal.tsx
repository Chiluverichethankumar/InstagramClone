// import React from 'react';
// import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
// import { useRoute, useNavigation } from '@react-navigation/native';
// import { useGetFollowersQuery, useGetFollowingQuery } from '../../store/api/services';

// export const FollowListModal: React.FC = () => {
//   const route = useRoute<any>();
//   const navigation = useNavigation<any>();
//   const { userId, type } = route.params as { userId: number; type: 'followers' | 'following' };

//   const { data = [] } =
//     type === 'followers'
//       ? useGetFollowersQuery(userId)
//       : useGetFollowingQuery(userId);

//   return (
//     <View style={styles.modalContainer}>
//       <Text style={styles.header}>{type === 'followers' ? 'Followers' : 'Following'}</Text>
//       <FlatList
//         data={data}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={({ item }) => (
//           <TouchableOpacity
//             style={styles.item}
//             onPress={() =>
//               navigation.navigate('UserProfile', { username: item.username })
//             }
//           >
//             <Text style={styles.name}>{item.username}</Text>
//           </TouchableOpacity>
//         )}
//         ListEmptyComponent={<Text style={styles.empty}>No {type} yet.</Text>}
//       />
//       <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
//         <Text style={styles.closeText}>Close</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   modalContainer: { flex: 1, padding: 24, backgroundColor: '#fff' },
//   header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
//   item: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
//   name: { fontSize: 17, color: '#222' },
//   empty: { textAlign: 'center', color: '#888', marginTop: 16 },
//   closeBtn: {
//     marginTop: 20,
//     alignSelf: 'center',
//     padding: 13,
//     backgroundColor: '#e8e8e8',
//     borderRadius: 10,
//   },
//   closeText: { color: '#444', fontWeight: '600' },
// });


// src/screens/user/FollowListModal.tsx
import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  View,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
} from '../../store/api/services';
import { useAppTheme } from '../../theme/ThemeContext';

export const FollowListModal = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { userId, username, type } = route.params as {
    userId: number;
    username: string;
    type: 'followers' | 'following';
  };

  // THIS IS THE KEY FIX – force empty array + skip when no userId
  const followersQuery = useGetFollowersQuery(userId, { skip: !userId });
  const followingQuery = useGetFollowingQuery(userId, { skip: !userId });

  const query = type === 'followers' ? followersQuery : followingQuery;
  const users = query.data ?? [];           // <-- NEVER undefined
  const isLoading = query.isLoading;
  const isError = query.isError;

  const title = type === 'followers' ? 'Followers' : 'Following';

React.useLayoutEffect(() => {
    navigation.setOptions({
        title: `${username}'s ${title}`,
        // 🌟 CHANGED: Replace Text with an Icon component
        headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 0, paddingRight: 15, paddingVertical: 5 }}>
                <Icon name="arrow-back-outline" size={28} color="#222" /> 
            </TouchableOpacity>
        ),
    });
}, [navigation, username, title]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#0095f6" />
      </SafeAreaView>
    );
  }

  // Error state (optional)
  if (isError) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.error}>Failed to load {title.toLowerCase()}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={users}                              // ← guaranteed to be array
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('UserProfile', { username: item.username })}
          >
            {item.profile_pic ? (
              <Image source={{ uri: item.profile_pic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {item.username?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.username}>@{item.username}</Text>
              {item.full_name && <Text style={styles.fullName}>{item.full_name}</Text>}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No {title.toLowerCase()} yet</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: { flexDirection: 'row', padding: 15, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12 },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3897f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarLetter: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  info: { flex: 1 },
  username: { fontWeight: '600', fontSize: 16 },
  fullName: { color: '#666', fontSize: 14 },
  empty: { textAlign: 'center', marginTop: 60, fontSize: 16, color: '#888' },
  error: { fontSize: 16, color: 'red' },
});