// D:\Projects\InstagramApp\Codes\forntend\instagram\src\screens\user\FollowListModal.tsx

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

  // Use skip to prevent query if userId is missing
  const followersQuery = useGetFollowersQuery(userId, { skip: !userId });
  const followingQuery = useGetFollowingQuery(userId, { skip: !userId });

  const query = type === 'followers' ? followersQuery : followingQuery;
  // FIX: Use nullish coalescing to ensure 'users' is always an array
  const users = query.data ?? [];           
  const isLoading = query.isLoading;
  const isError = query.isError;

  const title = type === 'followers' ? 'Followers' : 'Following';

  React.useLayoutEffect(() => {
    navigation.setOptions({
        title: `${username}'s ${title}`,
        // Header button uses theme color for text consistency
        headerLeft: () => (
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={{ marginLeft: 0, paddingRight: 15, paddingVertical: 5 }}
            >
                <Icon name="arrow-back-outline" size={28} color={theme.colors.text} /> 
            </TouchableOpacity>
        ),
    });
  }, [navigation, username, title, theme.colors.text]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#0095f6" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.error, { color: theme.colors.error }]}>Failed to load {title.toLowerCase()}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={users}                             
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
              <Text style={[styles.username, { color: theme.colors.text }]}>@{item.username}</Text>
              {item.full_name && <Text style={[styles.fullName, { color: theme.colors.textSecondary }]}>{item.full_name}</Text>}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>No {title.toLowerCase()} yet</Text>
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