// D:\Projects\InstagramApp\Codes\forntend\instagram\src\store\api\services.ts

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, SignupPayload, AuthResponse, LoginPayload, Post } from '../../types';

// 🌟 NEW INTERFACE for the Edit Profile Mutation payload
export interface UserProfileUpdate {
    full_name?: string;
    bio?: string;
    is_private?: boolean;
    // Add other fields you want to allow updating via the profile endpoint
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
      headers.set('Content-Type', 'application/json');
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
  ],
  endpoints: (builder) => ({
    // ================= Auth =================
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

    // ================= Profiles =================
    
    // GET /profiles/{username}/
    getUserProfileByUsername: builder.query<any, string>({
      query: (username) => ({ url: `profiles/${username}/`, method: 'GET' }),
      providesTags: (username) => [{ type: 'UserProfile' as const, id: username }],
    }),

    // 🌟 NEW MUTATION: PATCH /profiles/
    updateProfile: builder.mutation<any, UserProfileUpdate>({
      query: (data) => ({
        url: 'profiles/', // Assuming backend setup handles PATCH request to /api/profiles/
        method: 'PATCH', 
        body: data,
      }),
      invalidatesTags: ['Me', 'UserProfile'], // Invalidate own profile cache
    }),

    // Optional: fetch raw user by id if needed elsewhere
    getUser: builder.query<User, number>({
      query: (id) => ({ url: `users/${id}/`, method: 'GET' }),
      providesTags: ['UserProfile'],
    }),

    // followers/following lists from FollowerViewSet
    getFollowers: builder.query<User[], number>({
      query: (id) => ({ url: `followers/${id}/followers/`, method: 'GET' }),
      providesTags: ['Followers'],
    }),

    getFollowing: builder.query<User[], number>({
      query: (id) => ({ url: `followers/${id}/following/`, method: 'GET' }),
      providesTags: ['Following'],
    }),

    // POST /followers/{id}/follow/ 
    followUser: builder.mutation<any, number>({
      query: (id) => ({ url: `followers/${id}/follow/`, method: 'POST' }),
      invalidatesTags: ['Followers', 'Following', 'UserProfile', 'FriendRequests'],
    }),

    // POST /followers/{id}/unfollow/
    unfollowUser: builder.mutation<any, number>({
      query: (id) => ({ url: `followers/${id}/unfollow/`, method: 'POST' }),
      invalidatesTags: ['Followers', 'Following', 'UserProfile', 'FriendRequests'],
    }),

    // ================= Search =================
    // GET /search/users/?q=
    searchUsers: builder.query<any, string>({
      query: (q) => `search/users/?q=${encodeURIComponent(q)}`,
      keepUnusedDataFor: 60,
    }),

    // ================= Friend Requests =================
    // POST /friend-requests/  { receiver: <id> }
    sendFriendRequest: builder.mutation<any, number>({
      query: (id) => ({
        url: 'friend-requests/',
        method: 'POST',
        body: { receiver: id },
      }),
      invalidatesTags: ['FriendRequests'],
    }),

    // POST /friend-requests/{req_ID}/accept/
    acceptFriendRequest: builder.mutation<any, number>({
      query: (id) => ({
        url: `friend-requests/${id}/accept/`,
        method: 'POST',
      }),
      invalidatesTags: ['FriendRequests', 'Followers', 'Following'],
    }),

    // POST /friend-requests/{req_ID}/reject/
    rejectFriendRequest: builder.mutation<any, number>({
      query: (id) => ({
        url: `friend-requests/${id}/reject/`,
        method: 'POST',
      }),
      invalidatesTags: ['FriendRequests'],
    }),

    // GET /friend-requests/pending/   (receiver side)
    pendingRequests: builder.query<any[], void>({
      query: () => 'friend-requests/pending/',
      providesTags: ['FriendRequests'],
    }),

    // GET /friend-requests/sent/      (sender side)
    sentRequests: builder.query<any[], void>({
      query: () => 'friend-requests/sent/',
      providesTags: ['FriendRequests'],
    }),

    // GET /friend-requests/friends/
    friends: builder.query<User[], void>({
      query: () => 'friend-requests/friends/',
      providesTags: ['FriendRequests'],
    }),

    // ================= Posts / Feed =================
    // GET /posts/feed/?page=&limit=
    getPosts: builder.query<
      { posts: Post[]; nextPage?: number },
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => `posts/feed/?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? ['Posts', ...result.posts.map((p) => ({ type: 'Posts' as const, id: p.id }))]
          : ['Posts'],
    }),

    // PATCH /profiles/privacy/
    updatePrivacy: builder.mutation<{ is_private: boolean }, { is_private: boolean }>({
      query: (body) => ({
        url: 'profiles/privacy/',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['UserProfile', 'Me'],
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useGetUserQuery,
  // 🌟 EXPORT NEW MUTATION
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
  useUpdatePrivacyMutation
} = api;