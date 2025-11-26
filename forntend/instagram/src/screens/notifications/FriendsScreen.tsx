import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFriendsQuery } from '../../store/api/services';

export const FriendsScreen = () => {
  const { data: friends = [], isLoading } = useFriendsQuery();

  if (isLoading) return <Text style={styles.loading}>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mutual Friends</Text>
      <FlatList
        data={friends}
        keyExtractor={f => f.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.friendRow}>
            <Text style={styles.name}>{item.username}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No mutual friends.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  loading: { textAlign: 'center', marginTop: 28 },
  friendRow: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  name: { fontSize: 17 },
  empty: { textAlign: 'center', color: '#888', marginTop: 24 }
});
