## pip install django djangorestframework 
# This covers the packages in your requirements.txt

{
    "username": "ravi",

    "password": "Ravi@123"
}



{
    "username": "pavan",
    "password": "pavan@123"
}

{
    "username": "teja",
 
    "password": "teja@123"
}



Perfect! Since you’ve successfully tested signup, login, logout, me, and feed, now I’ll give you a step-by-step guide to test all other endpoints in Postman. I’ll organize it by feature so it’s easy to follow.

1️⃣ Posts

Base URL: http://127.0.0.1:8000/api/posts/

Action	Method	URL	Body / Params	Notes
List all posts	GET	/api/posts/	None	Returns all posts.
User posts	GET	/api/posts/user/<user_id>/	None	Replace <user_id> with ID.
Create post	POST	/api/posts/	form-data: caption, media (file, multiple allowed)	Must include X-Session-ID in headers for auth.
Delete post	DELETE	/api/posts/<post_id>/	None	Deletes post by ID. Requires X-Session-ID.
Feed (following posts)	GET	/api/posts/feed/	None	Returns posts from users you follow.
2️⃣ Comments

Base URL: http://127.0.0.1:8000/api/comments/

Action	Method	URL	Body / Params	Notes
List comments for post	GET	/api/comments/?post_id=<post_id>	None	Only top-level comments.
Create comment	POST	/api/comments/	post_id, content, optional parent (comment ID for replies)	Requires X-Session-ID.
Update comment	PUT / PATCH	/api/comments/<comment_id>/	content	Only the author can edit.
Delete comment	DELETE	/api/comments/<comment_id>/	None	Only the author can delete.
3️⃣ Likes

Base URL: http://127.0.0.1:8000/api/likes/

Action	Method	URL	Notes
Toggle like	POST	/api/likes/<post_id>/toggle/	Likes or unlikes a post.
List users who liked	GET	/api/likes/<post_id>/list_likes/	Returns user info.
4️⃣ Messages

Base URL: http://127.0.0.1:8000/api/messages/

Action	Method	URL	Body / Params	Notes
List messages	GET	/api/messages/<user_id>/	user_id = chat partner	Returns chat with that user.
Send message	POST	/api/messages/	receiver (ID), optional media (file), content	Requires X-Session-ID.
Mark as read	POST	/api/messages/<message_id>/mark_read/	None	Only receiver can mark read.
5️⃣ Followers / Following

Base URL: http://127.0.0.1:8000/api/followers/

Action	Method	URL	Notes
Follow user	POST	/api/followers/<user_id>/follow/	Follow target user.
Unfollow user	POST	/api/followers/<user_id>/unfollow/	Stop following target user.
List followers	GET	/api/followers/<user_id>/followers/	Returns all users following this user.
List following	GET	/api/followers/<user_id>/following/	Returns all users this user follows.
6️⃣ Friend Requests

Base URL: http://127.0.0.1:8000/api/friend-requests/

Action	Method	URL	Body / Params	Notes
Send request	POST	/api/friend-requests/send/	receiver (user ID)	Creates friend request.
Accept request	POST	/api/friend-requests/<request_id>/accept/	None	Only receiver can accept.
Reject request	POST	/api/friend-requests/<request_id>/reject/	None	Only receiver can reject.
Pending requests	GET	/api/friend-requests/pending/	None	Requests waiting for you.
7️⃣ Stories

Base URL: http://127.0.0.1:8000/api/stories/

Action	Method	URL	Body / Params	Notes
List active stories	GET	/api/stories/list_active/	None	Only stories not expired.
Create story	POST	/api/stories/	media (file)	Saves story with media type (image/video).
Mark story viewed	POST	/api/stories/<story_id>/mark_viewed/	None	Creates a StoryView record.
Get viewers	GET	/api/stories/<story_id>/viewers/	None	Only owner can see viewers.
Cleanup expired stories	POST	/api/stories/cleanup/	None	Removes expired stories from DB and Supabase.
8️⃣ User Search

Base URL: http://127.0.0.1:8000/api/search/users/

Action	Method	URL	Params	Notes
Search users	GET	/api/search/users/?q=<query>	q = search string	Returns max 20 users, min 2 chars query.