import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  useSearchUsersQuery,
  useGetMeQuery,
} from "../../store/api/services";
import { useAppTheme } from "../../theme/ThemeContext";

interface SearchUser {
  id: number;
  username: string;
  full_name?: string;
  profile_pic?: string;
}

export const UserSearchScreen: React.FC = () => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();

  const { data: meData } = useGetMeQuery();
  const currentUserId = meData?.id;

  // Debounce search input (Instagram-style smoothness)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useSearchUsersQuery(debouncedQuery, {
    skip: !debouncedQuery || debouncedQuery.length < 2,
  });

  const results: SearchUser[] = Array.isArray(data)
    ? data
    : data?.results ?? [];

  const handleUserPress = (item: SearchUser) => {
    if (item.id === currentUserId) {
      navigation.navigate("ProfileTab", { screen: "MyProfile" });
    } else {
      navigation.navigate("ProfileTab", {
        screen: "UserProfile",
        params: { username: item.username, userId: item.id },
      });
    }
  };

  const renderRow = ({ item }: { item: SearchUser }) => (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: theme.colors.border }]}
      onPress={() => handleUserPress(item)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      {item.profile_pic ? (
        <Image source={{ uri: item.profile_pic }} style={styles.avatar} />
      ) : (
        <View
          style={[
            styles.avatarPlaceholder,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <Text style={styles.avatarLetter}>
            {item.username?.[0]?.toUpperCase() ?? "?"}
          </Text>
        </View>
      )}

      {/* Text */}
      <View style={styles.textContainer}>
        <Text style={[styles.username, { color: theme.colors.text }]}>
          {item.username}
        </Text>
        {item.full_name && (
          <Text
            style={[styles.fullName, { color: theme.colors.textSecondary }]}
          >
            {item.full_name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Search Bar */}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
            color: theme.colors.text,
          },
        ]}
        placeholder="Search"
        placeholderTextColor={theme.colors.textSecondary}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        returnKeyType="search"
        autoFocus
      />

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          results.length === 0 ? styles.emptyList : styles.listContent
        }
        renderItem={renderRow}
        ListEmptyComponent={
          query.length < 2 ? (
            <View style={styles.emptyState}>
              <Text
                style={[
                  styles.emptyText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Type at least 2 characters…
              </Text>
            </View>
          ) : isFetching ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text
                style={[
                  styles.emptyText,
                  { marginTop: 10, color: theme.colors.textSecondary },
                ]}
              >
                Searching…
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text
                style={[
                  styles.emptyText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                No users found
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  input: {
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderRadius: 10,
    borderWidth: 1,
  },

  listContent: { paddingBottom: 20 },
  emptyList: { flexGrow: 1 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },

  textContainer: {
    marginLeft: 14,
    flex: 1,
  },

  username: {
    fontSize: 15,
    fontWeight: "600",
  },
  fullName: {
    fontSize: 14,
    marginTop: 2,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 16,
  },

  loadingWrapper: {
    flex: 1,
    alignItems: "center",
    paddingTop: 80,
  },
});
