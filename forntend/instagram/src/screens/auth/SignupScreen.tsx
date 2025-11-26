import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { Input } from '../../components/common/Input';
import { Loading } from '../../components/common/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';

export const SignupScreen = () => {
    const navigation = useNavigation<any>();
    const { handleSignup } = useAuth();
    const [form, setForm] = useState({
        username: '',
        email: '',
        full_name: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);

    const onChange = (key: keyof typeof form, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const validate = () => {
        if (!form.username || !form.email || !form.password) {
            Alert.alert('Username, email and password are required');
            return false;
        }
        const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!emailRegex.test(form.email)) {
            Alert.alert('Invalid email format');
            return false;
        }
        if (form.password.length < 6) {
            Alert.alert('Password must be at least 6 characters');
            return false;
        }
        return true;
    };

const onSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await handleSignup({
                username: form.username,
                email: form.email,
                password: form.password,
                full_name: form.full_name || undefined,
            });
            // Assuming handleSignup navigates to MainTabs on success
        } catch (e: any) {
            console.error('Signup error:', e);
            // This line is correct; it will now process the JSON error instead of the HTML error
            const errorMessage = e?.data?.error || e?.data?.message || e?.message || 'An error occurred';
            Alert.alert('Signup failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.logoContainer}>
                <Text style={styles.logo}>Instagram</Text>
                <Text style={styles.subtitle}>Sign up to see photos and videos from your friends.</Text>
            </View>

            <View style={styles.formContainer}>
                <Input
                    label=""
                    value={form.email}
                    onChangeText={v => onChange('email', v)}
                    placeholder="Email"
                    testID="signup-email"
                    keyboardType="email-address"
                />
                <Input
                    label=""
                    value={form.full_name}
                    onChangeText={v => onChange('full_name', v)}
                    placeholder="Full Name (Optional)"
                    testID="signup-fullname"
                />
                <Input
                    label=""
                    value={form.username}
                    onChangeText={v => onChange('username', v)}
                    placeholder="Username"
                    testID="signup-username"
                />
                <Input
                    label=""
                    value={form.password}
                    onChangeText={v => onChange('password', v)}
                    placeholder="Password"
                    secureTextEntry
                    testID="signup-password"
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={onSubmit}
                    testID="signup-submit"
                >
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>

                <Text style={styles.termsText}>
                    By signing up, you agree to our Terms, Data Policy and Cookies Policy.
                </Text>
            </View>

            <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginLink}>Log in</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        fontSize: 48,
        fontWeight: 'bold',
        fontFamily: 'cursive',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#8E8E8E',
        textAlign: 'center',
        paddingHorizontal: 20,
        fontWeight: '600',
    },
    formContainer: {
        width: '100%',
    },
    button: {
        backgroundColor: '#3797F0',
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    buttonText: {
        textAlign: 'center',
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    termsText: {
        textAlign: 'center',
        color: '#8E8E8E',
        fontSize: 12,
        marginTop: 20,
        paddingHorizontal: 20,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 20,
        borderTopWidth: 1,
        borderTopColor: '#DBDBDB',
        marginTop: 30,
    },
    loginText: {
        color: '#262626',
        fontSize: 14,
    },
    loginLink: {
        color: '#3797F0',
        fontWeight: '600',
        fontSize: 14,
    },
});