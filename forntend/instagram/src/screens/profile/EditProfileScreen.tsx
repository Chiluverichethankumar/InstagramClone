// D:\Projects\InstagramApp\Codes\forntend\instagram\src\screens\profile\EditProfileScreen.tsx

import React, { useState } from 'react';
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
    Image 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeContext';
import { useGetMeQuery, useUpdateProfileMutation } from '../../store/api/services'; 
import { Loading } from '../../components/common/Loading';

export const EditProfileScreen: React.FC = () => {
    const { theme } = useAppTheme();
    const navigation = useNavigation<any>();

    // Fetch current user data (for initial values)
    const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = useGetMeQuery();

    // Setup mutation hook
    const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

    // --- State for Form Fields ---
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [isPrivate, setIsPrivate] = useState(profile?.is_private || false);
    // Note: Username, email, and password usually require separate/more complex flows

    // --- Header Configuration ---
    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Edit Profile',
            headerShown: true,
            headerStyle: { backgroundColor: theme.colors.background },
            headerTitleAlign: 'center',
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 10 }}>
                    <Icon name="close-outline" size={30} color={theme.colors.text} />
                </TouchableOpacity>
            ),
            headerRight: () => (
                <TouchableOpacity onPress={handleSave} disabled={isUpdating || isProfileLoading} style={{ paddingHorizontal: 10 }}>
                    <Icon 
                        name="checkmark-done-outline" 
                        size={30} 
                        color={isUpdating ? theme.colors.textSecondary : theme.colors.primary} 
                    />
                </TouchableOpacity>
            ),
        });
    }, [navigation, fullName, bio, isPrivate, isUpdating, theme]);

    // --- Save Handler ---
    const handleSave = async () => {
        if (!profile) return;
        
        const data = {
            full_name: fullName.trim(),
            bio: bio.trim(),
            is_private: isPrivate,
        };

        try {
            // The mutation sends the updated profile data to your backend
            await updateProfile(data).unwrap(); 
            Alert.alert('Success', 'Profile updated successfully!');
            navigation.goBack();
        } catch (err: any) {
            Alert.alert('Error', err?.data?.error || 'Failed to update profile.');
        }
    };

    if (isProfileLoading) return <Loading />;
    if (isProfileError || !profile) return <Text style={[styles.errorText, {color: theme.colors.text}]}>Could not load profile data.</Text>;

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            
            {/* --- Profile Picture Section --- */}
            <View style={styles.profilePicContainer}>
                <Image
                    source={profile.profile_pic ? { uri: profile.profile_pic } : require('../../assets/avatar-placeholder.png')}
                    style={styles.avatar}
                />
                <TouchableOpacity style={styles.changePhotoBtn}>
                    <Text style={[styles.changePhotoText, { color: theme.colors.primary }]}>
                        Change Profile Photo
                    </Text>
                </TouchableOpacity>
            </View>

            {/* --- Form Fields --- */}
            <View style={styles.formContainer}>
                
                <Text style={[styles.label, {color: theme.colors.textSecondary}]}>Name</Text>
                <TextInput
                    style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Full Name"
                    placeholderTextColor={theme.colors.textSecondary}
                />

                <Text style={[styles.label, {color: theme.colors.textSecondary}]}>Bio</Text>
                <TextInput
                    style={[styles.input, styles.bioInput, { borderColor: theme.colors.border, color: theme.colors.text }]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Bio"
                    placeholderTextColor={theme.colors.textSecondary}
                    multiline
                />
                
                {/* --- Account Controls --- */}
                <View style={[styles.settingRow, { borderTopColor: theme.colors.border }]}>
                    <Text style={[styles.settingText, {color: theme.colors.text}]}>Private Account</Text>
                    <Switch
                        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                        thumbColor={theme.colors.background}
                        onValueChange={setIsPrivate}
                        value={isPrivate}
                    />
                </View>

                <TouchableOpacity style={[styles.settingRow, { borderBottomColor: theme.colors.border }]}>
                    <Text style={[styles.settingText, {color: theme.colors.text}]}>Personal Information Settings</Text>
                    <Icon name="chevron-forward-outline" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>

            </View>
            
            {isUpdating && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    errorText: {
        textAlign: 'center',
        paddingTop: 50,
        fontSize: 16,
    },
    profilePicContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#dbdbdb', // Fixed light border
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
    },
    changePhotoBtn: {
        padding: 5,
    },
    changePhotoText: {
        fontSize: 16,
        fontWeight: '600',
    },
    formContainer: {
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    label: {
        fontSize: 13,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 5,
    },
    input: {
        borderBottomWidth: 1,
        paddingVertical: 8,
        fontSize: 16,
    },
    bioInput: {
        minHeight: 80,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    settingText: {
        fontSize: 16,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});