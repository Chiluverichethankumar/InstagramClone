// D:\Projects\InstagramApp\Codes\forntend\instagram\src\screens\profile\UserSearchScreen.tsx

import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSearchUsersQuery } from '../../store/api/services';
import { useAppTheme } from '../../theme/ThemeContext';

// 🌟 Assuming your backend search returns a list of User objects, 
// where the profile data is nested under `item.profile`.

export const UserSearchScreen: React.FC = () => {
  const [query, setQuery] = useState('');
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();

  const { data, isFetching } = useSearchUsersQuery(query, { skip: query.length < 2 });
  // Check if data is an array (list of users) or an object with a 'results' key
  const users = Array.isArray(data) ? data : data?.results || [];

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.userRow, { borderBottomColor: theme.colors.border }]}
      // 🌟 CORRECT: Navigate using the user's username
      onPress={() => navigation.navigate('UserProfile', { username: item.username })}
    >
      {item.profile?.profile_pic ? (
        <Image source={{ uri: item.profile.profile_pic }} style={styles.avatar} />
      ) : (
        <View
          style={[
            styles.avatarPlaceholder,
            { backgroundColor: theme.colors.avatarBackground || '#3897f0' }, // Fallback color
          ]}
        >
          <Text style={styles.avatarText}>
            {item.username?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.username, { color: theme.colors.text }]}>
          {item.username}
        </Text>
        <Text style={[styles.fullName, { color: theme.colors.textSecondary }]}>
          {item.profile?.full_name || ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.inputBackground || '#efefef',
            color: theme.colors.text,
            borderColor: theme.colors.inputBorder || 'transparent',
          },
        ]}
        placeholder="Search users"
        placeholderTextColor={theme.colors.placeholder}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {isFetching && (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 16 }} />
      )}
      <FlatList
        data={users}
        // 🌟 IMPROVEMENT: Use the item ID as key if available, otherwise use username
        keyExtractor={(item) => (item.id?.toString() || item.username)}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={() =>
          query.length < 2 ? (
            <Text
              style={{
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginTop: 24,
              }}
            >
              Enter at least 2 characters to search.
            </Text>
          ) : (
            <Text
              style={{
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginTop: 24,
              }}
            >
              No users found.
            </Text>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: {
    margin: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  info: { marginLeft: 12 },
  username: { fontSize: 16, fontWeight: 'bold' },
  fullName: { fontSize: 14 },
});