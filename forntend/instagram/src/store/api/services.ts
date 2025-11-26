import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, SignupPayload, AuthResponse, LoginPayload, Post } from '../../types';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://instagramclone-hiah.onrender.com/api/',
    prepareHeaders: async (headers) => {
      const sessionId = await AsyncStorage.getItem('session_id');
      if (sessionId) headers.set('X-Session-ID', sessionId);
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'Auth', 'Me', 'Posts', 'Comments', 'Stories', 'Chat',
    'Followers', 'Following', 'UserProfile', 'FriendRequests'
  ],
  endpoints: (builder) => ({
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
      invalidatesTags: ['Auth'],
    }),
    getMe: builder.query<User, void>({
      query: () => ({ url: 'auth/me/', method: 'GET' }),
      transformResponse: (response: any) => response.user,
      providesTags: ['Me', 'Auth'],
    }),
    getUserProfileByUsername: builder.query<any, string>({
      query: (username) => ({ url: `profiles/${username}/`, method: 'GET' }),
      providesTags: ['UserProfile'],
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
      invalidatesTags: ['Followers', 'Following', 'UserProfile'],
    }),
    unfollowUser: builder.mutation<any, number>({
      query: (id) => ({ url: `followers/${id}/unfollow/`, method: 'POST' }),
      invalidatesTags: ['Followers', 'Following', 'UserProfile'],
    }),
    searchUsers: builder.query<any, string>({ // use "any" temporarily for username-based lists
      query: (q) => `search/users/?q=${encodeURIComponent(q)}`,
      keepUnusedDataFor: 60,
    }),
    sendFriendRequest: builder.mutation<any, number>({
      query: (id) => ({
        url: `friendrequests/send/`,
        method: 'POST',
        body: { receiver: id },
      }),
      invalidatesTags: ['FriendRequests'],
    }),
    acceptFriendRequest: builder.mutation<any, number>({
      query: (id) => ({
        url: `friendrequests/${id}/accept/`,
        method: 'POST',
      }),
      invalidatesTags: ['FriendRequests'],
    }),
    rejectFriendRequest: builder.mutation<any, number>({
      query: (id) => ({
        url: `friendrequests/${id}/reject/`,
        method: 'POST',
      }),
      invalidatesTags: ['FriendRequests'],
    }),
    pendingRequests: builder.query<any[], void>({
      query: () => `friendrequests/pending/`,
      providesTags: ['FriendRequests'],
    }),
    sentRequests: builder.query<any[], void>({
      query: () => `friendrequests/sent/`,
      providesTags: ['FriendRequests'],
    }),
    friends: builder.query<User[], void>({
      query: () => `friendrequests/friends/`,
      providesTags: ['FriendRequests'],
    }),
    getPosts: builder.query<{ posts: Post[]; nextPage?: number }, { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => `posts/feed/?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result
          ? ['Posts', ...result.posts.map((p) => ({ type: 'Posts' as const, id: p.id }))]
          : ['Posts'],
    })
  }),
});

// Export all the hooks
export const {
  useSignupMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useGetUserQuery,
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
} = api;
