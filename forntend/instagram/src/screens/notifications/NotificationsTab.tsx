import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  usePendingRequestsQuery,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
} from '../../store/api/services';

const NotificationsTab: React.FC = () => {
  const navigation = useNavigation<any>();

  const {
    data: requests = [],
    isLoading,
    refetch,
  } = usePendingRequestsQuery();

  const [acceptRequest, { isLoading: accepting }] = useAcceptFriendRequestMutation();
  const [rejectRequest, { isLoading: rejecting }] = useRejectFriendRequestMutation();

  const handleAccept = async (id: number) => {
    try {
      await acceptRequest(id).unwrap();
      await refetch();
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.data?.error || e?.data?.message || 'Failed to accept request',
      );
    }
  };

  const handleReject = async (id: number) => {
    try {
      await rejectRequest(id).unwrap();
      await refetch();
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.data?.error || e?.data?.message || 'Failed to reject request',
      );
    }
  };

  if (isLoading) {
    return <Text style={styles.loading}>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Friend Requests</Text>
      <FlatList
        data={requests}
        keyExtractor={(req) => req.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.requestRow}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() =>
                navigation.navigate('UserProfile', {
                  username: item.sender?.username,
                })
              }
            >
              <Text style={styles.sender}>{item.sender?.username}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAccept(item.id)}
              style={styles.acceptBtn}
              disabled={accepting || rejecting}
            >
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleReject(item.id)}
              style={styles.rejectBtn}
              disabled={accepting || rejecting}
            >
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
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  sender: { flex: 1, fontSize: 16 },
  acceptBtn: {
    padding: 8,
    backgroundColor: '#34c759',
    borderRadius: 6,
    marginRight: 10,
  },
  rejectBtn: { padding: 8, backgroundColor: '#ff3b30', borderRadius: 6 },
  acceptText: { color: '#fff', fontWeight: '600' },
  rejectText: { color: '#fff', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#888', marginTop: 25 },
});

export default NotificationsTab;
