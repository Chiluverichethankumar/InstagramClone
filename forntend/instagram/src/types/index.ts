export interface User {
    id: number;
    username: string;
    email: string;
    profile?: {
        full_name?: string;
        bio?: string;
        profile_pic?: string | null;
    };
}

export interface SignupPayload {
    username: string;
    email: string;
    password: string;
    full_name?: string;
}

export interface AuthResponse {
    message: string;
    session_id: string;
    user: User;
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface GetMeResponse {
    message: string;
    user: User;
}

export interface Post {
    id: number;
    user: User; // The user who created the post
    caption: string;
    media_url: string;
    media_type: 'image' | 'video';
    likes_count: number;
    comments_count: number;
    is_liked: boolean;
    created_at: string;
}