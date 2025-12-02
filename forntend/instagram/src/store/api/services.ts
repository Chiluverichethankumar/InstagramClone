
// src/store/api/services.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, SignupPayload, AuthResponse, LoginPayload, Post } from '../../types';

export interface UserProfileUpdate {
  full_name?: string;
  bio?: string;
  is_private?: boolean;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://instagramclone-hiah.onrender.com/api/',
    prepareHeaders: async (headers) => {
      const sessionId = await AsyncStorage.getItem('session_id');
      if (sessionId) {
        headers.set('X-Session-ID', sessionId);
      }
      // IMPORTANT: do not set Content-Type here; fetchBaseQuery will set application/json
      // for plain objects and multipart/form-data for FormData automatically.
      return headers;
    },
  }),
  tagTypes: [
    'Auth',
    'Me',
    'Posts',
    'Comments',
    'Stories',
    'Chat',
    'Followers',
    'Following',
    'UserProfile',
    'FriendRequests',
    'Search',
  ],
  endpoints: (builder) => ({
    // ===== Auth =====
    signup: builder.mutation<AuthResponse, SignupPayload>({
      query: (body) => ({ url: 'auth/signup/', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),

    login: builder.mutation<AuthResponse, LoginPayload>({
      query: (body) => ({ url: 'auth/login/', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),

    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({ url: 'auth/logout/', method: 'POST' }),
      invalidatesTags: ['Auth', 'Me', 'UserProfile'],
    }),

    getMe: builder.query<any, void>({
      query: () => ({ url: 'auth/me/', method: 'GET' }),
      transformResponse: (response: any) => response.user,
      providesTags: ['Me', 'Auth'],
    }),

    // ===== Profiles =====
    getUserProfileByUsername: builder.query<any, string>({
      query: (username) => ({ url: `profiles/${username}/`, method: 'GET' }),
      providesTags: (_result, _error, username) => [
        { type: 'UserProfile' as const, id: username },
      ],
    }),

    updateProfile: builder.mutation<any, UserProfileUpdate>({
      query: (data) => ({
        url: 'profiles/',
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Me', 'UserProfile'],
    }),

    uploadProfilePicture: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: 'profiles/upload-picture/',
        method: 'PATCH',
        body: formData,
      }),
      invalidatesTags: ['Me', 'UserProfile'],
    }),

    getUser: builder.query<User, number>({
      query: (id) => ({ url: `users/${id}/`, method: 'GET' }),
      providesTags: ['UserProfile'],
    }),

    getFollowers: builder.query<User[], number>({
      query: (id) => ({ url: `followers/${id}/followers/`, method: 'GET' }),
      providesTags: ['Followers'],
    }),

    getFollowing: builder.query<User[], number>({
      query: (id) => ({ url: `followers/${id}/following/`, method: 'GET' }),
      providesTags: ['Following'],
    }),

    followUser: builder.mutation<any, number>({
      query: (id) => ({ url: `followers/${id}/follow/`, method: 'POST' }),
      invalidatesTags: ['Followers', 'Following', 'UserProfile', 'FriendRequests'],
    }),

    unfollowUser: builder.mutation<any, number>({
      query: (id) => ({ url: `followers/${id}/unfollow/`, method: 'POST' }),
      invalidatesTags: ['Followers', 'Following', 'UserProfile', 'FriendRequests'],
    }),

    // ===== Search =====
    searchUsers: builder.query<any, string>({
    query: (q) => ({
        url: 'search/users/',
        params: { q }  // ✅ Sends ?q=teja automatically
    }),
    keepUnusedDataFor: 60,
    }),

    // ===== Friend Requests =====
    sendFriendRequest: builder.mutation<any, number>({
      query: (id) => ({
        url: 'friend-requests/',
        method: 'POST',
        body: { receiver: id },
      }),
      invalidatesTags: ['FriendRequests'],
    }),

    acceptFriendRequest: builder.mutation<any, number>({
      query: (id) => ({
        url: `friend-requests/${id}/accept/`,
        method: 'POST',
      }),
      invalidatesTags: ['FriendRequests', 'Followers', 'Following'],
    }),

    rejectFriendRequest: builder.mutation<any, number>({
      query: (id) => ({
        url: `friend-requests/${id}/reject/`,
        method: 'POST',
      }),
      invalidatesTags: ['FriendRequests'],
    }),

    pendingRequests: builder.query<any[], void>({
      query: () => 'friend-requests/pending/',
      providesTags: ['FriendRequests'],
    }),

    sentRequests: builder.query<any[], void>({
      query: () => 'friend-requests/sent/',
      providesTags: ['FriendRequests'],
    }),

    friends: builder.query<User[], void>({
      query: () => 'friend-requests/friends/',
      providesTags: ['FriendRequests'],
    }),

    // ===== Posts / Feed =====
    getPosts: builder.query<
      { posts: Post[]; nextPage?: number },
      { page?: number; limit?: number }
      >({
      query: ({ page = 1, limit = 10 }) =>
        `posts/feed/?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? [
              'Posts',
              ...result.posts.map((p) => ({ type: 'Posts' as const, id: p.id })),
            ]
          : ['Posts'],
    }),

    // ===== Privacy =====
    updatePrivacy: builder.mutation<{ is_private: boolean }, { is_private: boolean }>({
      query: (body) => ({
        url: 'profiles/privacy/',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['UserProfile', 'Me'],
    }),
    // ADD THIS MISSING ENDPOINT — THIS IS THE ONLY FIX
  getUserPosts: builder.query<{ posts: Post[] }, { userId?: number; limit?: number }>({
    query: ({ userId, limit = 30 }) => 
      userId 
        ? `posts/user/${userId}/?limit=${limit}`
        : `posts/my-posts/?limit=${limit}`, // fallback to own posts
    providesTags: (result, error, arg) => 
      result
        ? [
            'Posts',
            ...result.posts.map(p => ({ type: 'Posts' as const, id: p.id })),
            { type: 'UserProfile', id: arg.userId || 'ME' }
          ]
        : ['Posts'],
  }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useGetUserQuery, // will exist because endpoint is getUser
  useUpdateProfileMutation,
  useGetUserProfileByUsernameQuery,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useSearchUsersQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  usePendingRequestsQuery,
  useSentRequestsQuery,
  useFriendsQuery,
  useGetPostsQuery,
  useUpdatePrivacyMutation,
  useUploadProfilePictureMutation,
  useGetUserPostsQuery,
} = api;