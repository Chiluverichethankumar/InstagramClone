import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { usePendingRequestsQuery, useAcceptFriendRequestMutation, useRejectFriendRequestMutation } from '../../store/api/services';

export const NotificationsTab = () => {
  const { data: requests = [], isLoading } = usePendingRequestsQuery();
  const [accept] = useAcceptFriendRequestMutation();
  const [reject] = useRejectFriendRequestMutation();

  if (isLoading) return <Text style={styles.loading}>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Friend Requests</Text>
      <FlatList
        data={requests}
        keyExtractor={req => req.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.requestRow}>
            <Text style={styles.sender}>{item.sender?.username}</Text>
            <TouchableOpacity onPress={() => accept(item.id)} style={styles.acceptBtn}>
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => reject(item.id)} style={styles.rejectBtn}>
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No requests.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  loading: { textAlign: 'center', marginTop: 24 },
  requestRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, padding: 8, borderBottomWidth: 1, borderColor: '#eee' },
  sender: { flex: 1, fontSize: 16 },
  acceptBtn: { padding: 8, backgroundColor: '#34c759', borderRadius: 6, marginRight: 10 },
  rejectBtn: { padding: 8, backgroundColor: '#ff3b30', borderRadius: 6 },
  acceptText: { color: '#fff', fontWeight: '600' },
  rejectText: { color: '#fff', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#888', marginTop: 25 }
});
