import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useGetFollowersQuery, useGetFollowingQuery } from '../../store/api/services';

export const FollowListModal = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { userId, type } = route.params;
  const { data = [] } =
    type === 'followers' ? useGetFollowersQuery(userId) : useGetFollowingQuery(userId);

  return (
    <View style={styles.modalContainer}>
      <Text style={styles.header}>{type === 'followers' ? 'Followers' : 'Following'}</Text>
      <FlatList
        data={data}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              navigation.navigate('UserProfile', { username: item.username });
            }}>
            <Text style={styles.name}>{item.username}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No {type} yet.</Text>}
      />
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
        <Text style={styles.closeText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, padding: 24, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  name: { fontSize: 17, color: '#222' },
  empty: { textAlign: 'center', color: '#888', marginTop: 16 },
  closeBtn: { marginTop: 20, alignSelf: 'center', padding: 13, backgroundColor: '#e8e8e8', borderRadius: 10 },
  closeText: { color: '#444', fontWeight: '600' }
});
