# 🚀 Django REST Backend API Documentation

This document outlines the core API endpoints for the social media platform, organized by feature.

## 🔗 Base URL Configuration

The base URL for all endpoints depends on your environment:

| Environment | Base URL Example |
| :--- | :--- |
| **Local Development** | `http://127.0.0.1:8000` |
| **Cloud Deployment** | `https://yourappname.up.railway.app` (or similar) |

---

## 1️⃣ Authentication & User Management

| No | Feature | Method | Endpoint | Body (JSON) Example | Headers | Expected Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1.1** | **Sign Up** | POST | `/auth/signup/` | `{"username": "john", "email": "j@ex.com", "password": "123", "full_name": "John Doe"}` | `Content-Type: application/json` | `201 Created` |
| **1.2** | **Login** | POST | `/auth/login/` | `{"username": "john", "password": "123"}` | `Content-Type: application/json` | `200 OK` |
| **1.3** | **Logout** | POST | `/auth/logout/` | – | `X-Session-ID` | `200 OK` |
| **1.4** | **Get Current User** | GET | `/auth/me/` | – | `X-Session-ID` | `200 OK` |
| **1.5** | **Search Users** | GET | `/users/search/?q=<query>` | – | `X-Session-ID` | `200 OK` |

---

## 2️⃣ Relationships & Friend Requests (Followers/Friends)

| No | Feature | Method | Endpoint | Body (JSON) | Headers | Expected Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **2.1** | **Follow User** | POST | `/followers/{user_id}/follow/` | – | `X-Session-ID` | `200 OK` |
| **2.2** | **Unfollow User** | POST | `/followers/{user_id}/unfollow/` | – | `X-Session-ID` | `200 OK` |
| **2.3** | **List Followers** | GET | `/followers/{user_id}/followers/` | – | `X-Session-ID` | `200 OK` (List) |
| **2.4** | **List Following** | GET | `/followers/{user_id}/following/` | – | `X-Session-ID` | `200 OK` (List) |
| **2.5** | **Send Friend Request** | POST | `/friend-requests/send/` | `{"receiver": "<user_id>"}` | `X-Session-ID` | `200 OK` |
| **2.6** | **Accept Request** | POST | `/friend-requests/{request_id}/accept/` | – | `X-Session-ID` | `200 OK` |
| **2.7** | **Reject Request** | POST | `/friend-requests/{request_id}/reject/` | – | `X-Session-ID` | `200 OK` |
| **2.8** | **List Pending Requests** | GET | `/friend-requests/pending/` | – | `X-Session-ID` | `200 OK` (List) |
| **2.9** | **List Friends** | GET | `/friend-requests/friends/` | – | `X-Session-ID` | `200 OK` (List) |

---

## 3️⃣ Posts & Feed

| No | Feature | Method | Endpoint | Request Details | Headers | Expected Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **3.1** | **Create Post** | POST | `/posts/` | **Form-data**: `media` (File, required) | `X-Session-ID`, `Content-Type: multipart/form-data` | `201 Created` |
| **3.2** | **Get Feed** | GET | `/posts/feed/` | – | `X-Session-ID` | `200 OK` (Paginated posts) |
| **3.3** | **Get User Posts** | GET | `/posts/user/{user_id}/` | – | `X-Session-ID` | `200 OK` (Paginated posts) |
| **3.4** | **Delete Post** | DELETE | `/posts/{post_id}/` | – | `X-Session-ID` | `204 No Content` |

---

## 4️⃣ Post Interactions (Likes & Comments)

| No | Feature | Method | Endpoint | Body (JSON) Example | Headers | Expected Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **4.1** | **Toggle Like** | POST | `/likes/{post_id}/toggle/` | – | `X-Session-ID` | `200 OK` |
| **4.2** | **List Likes** | GET | `/likes/{post_id}/list_likes/` | – | `X-Session-ID` | `200 OK` (List of users) |
| **4.3** | **Add Comment** | POST | `/comments/` | `{"post": "<post_id>", "content": "Nice post!"}` | `X-Session-ID` | `201 Created` |
| **4.4** | **Get Comments** | GET | `/comments/?post_id=<post_id>` | – | `X-Session-ID` | `200 OK` (List of comments) |

---

## 5️⃣ Direct Messages (DM)

| No | Feature | Method | Endpoint | Request Details | Headers | Expected Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **5.1** | **Send Message** | POST | `/messages/` | **Form-data**: `receiver` (Text), `media` (File, optional) | `X-Session-ID` | `201 Created` |
| **5.2** | **Get Chat History** | GET | `/messages/chat/{user_id}/` | – | `X-Session-ID` | `200 OK` (List of messages) |
| **5.3** | **Mark Message Read** | POST | `/messages/{msg_id}/mark_read/` | – | `X-Session-ID` | `200 OK` |

---

## 6️⃣ Stories

| No | Feature | Method | Endpoint | Request Details | Headers | Expected Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **6.1** | **Create Story** | POST | `/stories/` | **Form-data**: media `file` | `X-Session-ID`, `Content-Type: multipart/form-data` | `201 Created` |
| **6.2** | **List Active Stories** | GET | `/stories/list_active/` | – | `X-Session-ID` | `200 OK` (List of stories) |
| **6.3** | **Mark Story Viewed** | POST | `/stories/{story_id}/mark_viewed/` | – | `X-Session-ID` | `200 OK` |
| **6.4** | **View Story Viewers** | GET | `/stories/{story_id}/viewers/` | – | `X-Session-ID` | `200 OK` (List of users) |
| **6.5** | **Delete Story** | DELETE | `/stories/{story_id}/delete_story/` | – | `X-Session-ID` | `204 No Content` |
| **6.6** | **Cleanup Expired Stories** | POST | `/stories/cleanup/` | – | `X-Session-ID` | `200 OK` |

---

## ✅ Best Practices & Testing Tips

* **Authentication:** All protected routes require the **`X-Session-ID: <session_key>`** header.
* **File Uploads:** Use **`Content-Type: multipart/form-data`** (e.g., in Postman's **Body > form-data** tab) for any request involving media files (Posts, Stories, Messages).
* **Workflow:** Test in a logical order: **Signup → Login → Create Content → Interact → Logout.**
* **Variables:** Use environment variables in your testing tool (like Postman) for easy management of values like:
    * `{{base_url}}` (e.g., `http://127.0.0.1:8000`)
    * `{{session_id}}` (copied after Login/Signup)
    * `{{user_id}}`, `{{post_id}}`, `{{story_id}}` (saved from successful responses)