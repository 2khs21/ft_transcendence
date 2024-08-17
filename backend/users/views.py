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