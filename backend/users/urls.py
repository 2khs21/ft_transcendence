#users/urls.py
from django.urls import path
from .views import RegisterView, LoginView, FollowUserView, UserProfileView, OtherUserProfileView, UserListView, FriendView, MuteView, PongRecordListCreateView,LogoutView,VerifyEmailView, SendVerificationEmailView, VerifyTokenView, CheckFriendRelationView
from . import views

urlpatterns = [
	path('', UserListView.as_view(), name='user-list'),
	path('friend/', FriendView.as_view(), name='friend'),
	path('mute/', MuteView.as_view(), name='mute'),

	path('verify-token/', VerifyTokenView.as_view(), name='verify-token'),

	path('register/', RegisterView.as_view(), name='register'),
	path('login/', LoginView.as_view(), name='login'),
	path('send-verification/', SendVerificationEmailView.as_view(), name='send-verification'),  # 새로 추가된 URL
	path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
	
	path('follow/', FollowUserView.as_view(), name='follow_user'),

	path('profile/', UserProfileView.as_view(), name='user-profile'),
	path('profile/<str:username>/', OtherUserProfileView.as_view(), name='other-user-profile'),


	path('connected/', views.get_connected_users),
	path('connect/', views.user_connected),
	path('disconnect/', views.user_disconnected),
	path('pong-record/', PongRecordListCreateView.as_view(), name='pong-record-list-create'),

	path('oauth/login/', views.oauth_login, name='oauth_login'),
	path('oauth/callback/', views.oauth_callback, name='oauth_callback'),
	path('logout/', LogoutView.as_view(), name='logout'),
    path('check-friend-relation/<str:user1>/<str:user2>/', CheckFriendRelationView.as_view(), name='check-friend-relation'),

]