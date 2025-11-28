import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useGetPostsQuery } from '../../store/api/services';
import { Loading } from '../../components/common/Loading';
import { useAppTheme } from '../../theme/ThemeContext';

export const HomeScreen: React.FC = () => {
  const { data, isLoading, error } = useGetPostsQuery({ page: 1, limit: 10 });
  const { theme } = useAppTheme();

  if (isLoading) return <Loading />;

  if (error || !data) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Failed to load feed
        </Text>
      </View>
    );
  }

  const posts = data.posts || [];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Your Feed
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Total posts: {posts.length}
      </Text>

      {posts.map((post) => (
        <View key={post.id} style={styles.postCard}>
          <Text style={[styles.postText, { color: theme.colors.text }]}>
            {post.caption || '(no caption)'}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorText: { fontSize: 16, textAlign: 'center', marginTop: 24 },
  title: { fontSize: 22, fontWeight: '600', marginTop: 16, marginHorizontal: 16 },
  subtitle: { fontSize: 14, marginHorizontal: 16, marginBottom: 12 },
  postCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f4f4f4',
  },
  postText: { fontSize: 14 },
});
