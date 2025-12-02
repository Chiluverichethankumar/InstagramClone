// src/screens/profile/EditProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
// Removed: AsyncStorage from react-native (no longer needed here)
import { useAppTheme } from '../../theme/ThemeContext';
import {
  useGetMeQuery,
  useUpdateProfileMutation,
  useUpdatePrivacyMutation,
  useUploadProfilePictureMutation, // 🚀 NEW IMPORT
} from '../../store/api/services';
import { Loading } from '../../components/common/Loading';

export const EditProfileScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();

  const { data: profile, isLoading: isProfileLoading } = useGetMeQuery();
  const [updateProfile] = useUpdateProfileMutation();
  const [updatePrivacy] = useUpdatePrivacyMutation();
  const [uploadPicture, { isLoading: isUploadingPicture }] = useUploadProfilePictureMutation(); // 🚀 NEW HOOK

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  // Removed: [uploading, setUploading] useState (replaced by RTK Query's isUploadingPicture)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setIsPrivate(profile.is_private || false);
      setProfilePic(profile.profile_pic || null);
    }
  }, [profile]);

  const isSaving = isUploadingPicture; // Use the RTK Query loading state

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Edit Profile',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingLeft: 15 }}>
          <Text style={{ fontSize: 32, fontWeight: '300', color: theme.colors.text }}>×</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={{ color: '#0095f6', fontWeight: '600', fontSize: 17, paddingRight: 15 }}>
            {isSaving ? 'Saving...' : 'Done'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, fullName, bio, isPrivate, isSaving]);

  const pickImage = () => {
    launchImageLibrary({
      mediaType: 'photo',
      includeBase64: false,
      quality: 0.8,
    }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Something went wrong');
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.uri) {
          // Update the local state for immediate visual feedback
          setProfilePic(asset.uri); 
          uploadImage(asset);
        }
      }
    });
  };

  // 🚀 REPLACED CUSTOM FETCH WITH RTK QUERY MUTATION
  const uploadImage = async (asset: { uri: string; fileName?: string; type?: string }) => {
    // setUploading(true) is now handled by isUploadingPicture

    const formData = new FormData();
    formData.append('profile_pic', { // Key must match 'profile_pic' in Django view
      uri: asset.uri,
      name: asset.fileName || 'profile.jpg',
      type: asset.type || 'image/jpeg',
    } as any);

    try {
      // Use the RTK Query mutation hook
      await uploadPicture(formData).unwrap(); 
      Alert.alert('Success', 'Profile picture updated!');
      // The useGetMeQuery cache will automatically refresh due to invalidatesTags: ['Me']
    } catch (error: any) {
      console.error('Upload Error:', error);
      // Revert the local image if the upload fails
      setProfilePic(profile?.profile_pic || null); 
      Alert.alert('Upload Failed', error?.data?.error || 'Failed to upload photo via RTK Query.');
    } 
    // finally block is no longer needed since RTK Query handles the loading state
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      // 1. Update text fields only if they have changed
      const fullNameChanged = fullName.trim() !== (profile.full_name || '');
      const bioChanged = bio.trim() !== (profile.bio || '');

      if (fullNameChanged || bioChanged) {
        await updateProfile({
          full_name: fullName.trim(),
          bio: bio.trim(),
        }).unwrap();
      }

      // 2. Update privacy only if it has changed
      if (isPrivate !== profile.is_private) {
        await updatePrivacy({ is_private: isPrivate }).unwrap();
      }

      // Only show success if at least one thing changed, or if we were already saving.
      if (fullNameChanged || bioChanged || isPrivate !== profile.is_private) {
        Alert.alert('Success', 'Profile updated!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        navigation.goBack(); // If nothing changed, just navigate back
      }
    } catch (err: any) {
      // CRITICAL FIX: The error structure for RTK Query is different than raw fetch
      console.error('Profile Save Error:', err);
      Alert.alert('Error', err?.data?.error || err?.data?.detail || 'Failed to save profile.');
    }
  };

  if (isProfileLoading) return <Loading />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Profile Picture */}
      <View style={styles.profilePicSection}>
        <Image
          source={profilePic ? { uri: profilePic } : require('../../assets/avatar-placeholder.png')}
          style={styles.avatar}
        />
        <TouchableOpacity onPress={pickImage} disabled={isUploadingPicture}> {/* Use RTK loading state */}
          <Text style={styles.changePhotoText}>
            {isUploadingPicture ? 'Uploading...' : 'Change Profile Photo'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.privacyRow}>
          <View>
            <Text style={styles.privacyLabel}>Private Account</Text>
            <Text style={styles.privacyHint}>
              Only approved followers can see your posts.
            </Text>
          </View>
          <Switch value={isPrivate} onValueChange={setIsPrivate} />
        </View>
      </View>

      {/* Conditionally show overlay based on RTK loading state */}
      {isUploadingPicture && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#0095f6" />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // ... (omitted styles, they are correct) ...
  profilePicSection: { alignItems: 'center', paddingVertical: 30 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  changePhotoText: { color: '#0095f6', fontSize: 17, fontWeight: '600', marginTop: 12 },
  form: { paddingHorizontal: 16 },
  label: { fontSize: 14, color: '#8e8e93', marginTop: 24, marginBottom: 8 },
  input: { borderBottomWidth: 1, borderColor: '#dbdbdb', paddingVertical: 10, fontSize: 16 },
  bioInput: { height: 100 },
  privacyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30 },
  privacyLabel: { fontSize: 17, fontWeight: '600' },
  privacyHint: { fontSize: 14, color: '#8e8e93', marginTop: 4, width: '70%' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});