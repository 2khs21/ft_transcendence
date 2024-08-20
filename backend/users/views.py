from django.contrib.auth.models import User #User 모델을 사용하기 위함
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .serializers import RegisterSerializer, LoginSerializer

from django.contrib.auth import get_user_model
User = get_user_model()  # 현재 프로젝트의 User 모델을 가져옵니다.

class RegisterView(generics.CreateAPIView):
	# CreateAPIView : POST 요청에 대해 create 메서드를 호출하여 새로운 리소스를 생성
	queryset = User.objects.all()
	serializer_class = RegisterSerializer

# class LoginView(generics.GenericAPIView):
# 	serializer_class = LoginSerializer

# 	def post(self, request):
# 		serializer = self.get_serializer(data=request.data)
# 		serializer.is_valid(raise_exception=True)
# 		token = serializer.validated_data['token'] #validate()의 리턴값인 Token을 받아옴.
# 		return Response({"token": token.key}, status=status.HTTP_200_OK)
	
class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data['token']  # validate()의 리턴값인 토큰 키를 받아옴.
        return Response({"token": token}, status=status.HTTP_200_OK)
    
from .serializers import FollowSerializer

from django.contrib.auth import get_user_model
User = get_user_model()

class FollowUserView(APIView):
    permission_classes = [IsAuthenticated]  # 인증된 사용자만 접근 가능

    def post(self, request):
        serializer = FollowSerializer(data=request.data)
        if serializer.is_valid():
            username_to_follow = serializer.validated_data['username']
            user_to_follow = User.objects.get(username=username_to_follow)
            
            # 자기 자신을 팔로우하려는 경우 방지
            if request.user == user_to_follow:
                return Response({"detail": "You cannot follow yourself"}, status=status.HTTP_400_BAD_REQUEST)
            
            # 이미 팔로우한 사용자를 다시 팔로우하려는 경우 방지
            if request.user.is_following(user_to_follow):
                return Response({"detail": "You are already following this user"}, status=status.HTTP_400_BAD_REQUEST)
            
            # 팔로우 실행
            request.user.follow(user_to_follow)
            return Response({"detail": f"You are now following {username_to_follow}"}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

###################### profile ######################	
from rest_framework import generics, permissions
from .models import User
from .serializers import UserProfileSerializer
from .serializers import UserProfileSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated] # 인증된 사용자만

    def get_object(self):
        return self.request.user

class OtherUserProfileView(generics.RetrieveAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()
    lookup_field = 'username'


from rest_framework import status
from rest_framework.response import Response
class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # 이미지 처리
        if 'profile_image' in request.FILES:
            instance.profile_image = request.FILES['profile_image']
        
        # 상태 메시지 처리
        if 'status_message' in request.data:
            instance.status_message = request.data['status_message']
        
        instance.save()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    

############### 접속한 유저목록 보기 ###############

from rest_framework.decorators import api_view
from rest_framework.response import Response

connected_users = set()  # 접속 중인 유저를 저장할 set

@api_view(['GET'])
def get_connected_users(request):
    return Response(list(connected_users))

@api_view(['POST'])
def user_connected(request):
    username = request.data.get('username')
    if username:
        connected_users.add(username)
    return Response({"status": "success"})

@api_view(['POST'])
def user_disconnected(request):
    username = request.data.get('username')
    if username and username in connected_users:
        connected_users.remove(username)
    return Response({"status": "success"})



#### friend, mute ####
from .serializers import UserSerializer, FriendSerializer, MuteSerializer
class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class FriendView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friends = request.user.friends.all()
        serializer = UserSerializer(friends, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = FriendSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            action = serializer.validated_data['action']
            try:
                user_to_manage = User.objects.get(username=username)
                if action == 'add':
                    request.user.add_friend(user_to_manage)
                    return Response({"detail": f"User {username} has been added as a friend"})
                elif action == 'remove':
                    request.user.remove_friend(user_to_manage)
                    return Response({"detail": f"User {username} has been removed from friends"})
                else:
                    return Response({"detail": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MuteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        muted_users = request.user.muted_users.all()
        serializer = UserSerializer(muted_users, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = MuteSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            action = serializer.validated_data['action']
            try:
                user_to_manage = User.objects.get(username=username)
                if action == 'mute':
                    request.user.mute_user(user_to_manage)
                    return Response({"detail": f"User {username} has been muted"})
                elif action == 'unmute':
                    request.user.unmute_user(user_to_manage)
                    return Response({"detail": f"User {username} has been unmuted"})
                else:
                    return Response({"detail": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    



################# record #################

from .models import PongRecord
from .serializers import PongRecordSerializer

class PongRecordListCreateView(generics.ListCreateAPIView):
    queryset = PongRecord.objects.all()
    serializer_class = PongRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
