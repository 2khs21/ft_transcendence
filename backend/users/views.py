from django.contrib.auth.models import User #User 모델을 사용하기 위함
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .serializers import RegisterSerializer, LoginSerializer

import logging
logger = logging.getLogger(__name__)

from django.contrib.auth import get_user_model
User = get_user_model()  # 현재 프로젝트의 User 모델을 가져옵니다.



########### 2FA email ############
# from django.core.mail import send_mail
# from django.conf import settings
# from rest_framework import status
# from rest_framework.response import Response
# from rest_framework.views import APIView
# from .models import EmailVerification, User
# from django.contrib.auth import authenticate
# from .serializers import RegisterSerializer, LoginSerializer, EmailVerificationSerializer
# from django.core.validators import validate_email
# from django.core.exceptions import ValidationError


from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import EmailVerification, User
from .serializers import RegisterSerializer, EmailVerificationSerializer
from django.core.validators import validate_email
from django.core.exceptions import ValidationError


class SendVerificationEmailView(APIView):
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            validate_email(email)
            
            if User.objects.filter(email=email).exists():
                return Response({"detail": "A user with that email already exists."}, status=status.HTTP_400_BAD_REQUEST)
            
            verification_code = EmailVerification.generate_verification_code()
            EmailVerification.objects.update_or_create(
                email=email,
                defaults={'verification_code': verification_code, 'is_verified': False}
            )
            
            self.send_verification_email(email, verification_code)
            
            return Response({"detail": "Verification email sent"}, status=status.HTTP_200_OK)
        
        except ValidationError:
            return Response({"detail": "Invalid email address"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def send_verification_email(self, email, code):
        subject = 'Email Verification Code'
        message = f'Your verification code is: {code}'
        send_mail(subject, message, settings.EMAIL_HOST_USER, [email])

class VerifyEmailView(APIView):
    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']
            
            try:
                verification = EmailVerification.objects.get(email=email, verification_code=code)
                if verification.is_verified:
                    return Response({"detail": "Email already verified"}, status=status.HTTP_400_BAD_REQUEST)
                
                verification.is_verified = True
                verification.save()
                
                return Response({"detail": "Email verified successfully"}, status=status.HTTP_200_OK)
            
            except EmailVerification.DoesNotExist:
                return Response({"detail": "Invalid verification code"}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                verification = EmailVerification.objects.get(email=email, is_verified=True)
            except EmailVerification.DoesNotExist:
                return Response({"detail": "Email not verified"}, status=status.HTTP_400_BAD_REQUEST)
            
            user = serializer.save()
            verification.delete()  # 인증 정보 삭제
            
            return Response({"detail": "User registered successfully"}, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
import random
import string
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from .models import EmailVerification
from .serializers import LoginSerializer
from rest_framework_simplejwt.tokens import RefreshToken
import random
import string
class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({"detail": "Both username and password are required"}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)

        if user is None:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        # 이메일 인증 확인 로직 제거

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'username': user.username,
            'email': user.email
        }, status=status.HTTP_200_OK)

##################################


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

###### oauth ######
from django.shortcuts import redirect
from django.conf import settings
import urllib.parse


def oauth_login(request):
    params = {
        'client_id': settings.FORTYTWO_CLIENT_ID,
        'redirect_uri': settings.FORTYTWO_REDIRECT_URI,
        'response_type': 'code',
        'scope': 'public'
    }
    logger.info("oauth_login info")
    url = f"{settings.FORTYTWO_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return redirect(url)

import requests
from django.http import JsonResponse
from django.conf import settings
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import redirect
from django.conf import settings

def oauth_callback(request):
    logger.info("oauth_callback function called")
    code = request.GET.get('code')
    if not code:
        return JsonResponse({'error': 'No code provided'}, status=400)
    
    # 액세스 토큰 요청
    token_response = requests.post(settings.FORTYTWO_TOKEN_URL, data={
        'grant_type': 'authorization_code',
        'client_id': settings.FORTYTWO_CLIENT_ID,
        'client_secret': settings.FORTYTWO_CLIENT_SECRET,
        'code': code,
        'redirect_uri': settings.FORTYTWO_REDIRECT_URI
    })
    
    if token_response.status_code != 200:
        return JsonResponse({'error': 'Failed to obtain access token'}, status=400)
    
    access_token = token_response.json().get('access_token')
    
    # 사용자 정보 요청
    user_response = requests.get(settings.FORTYTWO_API_URL, headers={
        'Authorization': f'Bearer {access_token}'
    })
    
    if user_response.status_code != 200:
        return JsonResponse({'error': 'Failed to fetch user data'}, status=400)
    
    user_data = user_response.json()
    
    # 사용자 생성 또는 조회
    user, created = User.objects.get_or_create(
        username=user_data['login'],
        defaults={'email': user_data['email']}
    )
    logger.info(f"User {user_data['login']} connected")
    connected_users.add(user_data['login'])

    # JWT 토큰 생성
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    logger.info(f"Refresh Token: {str(refresh)}")
    logger.info(f"Access Token: {access_token}")
    
    # 프론트엔드 URL로 리다이렉트 (토큰을 URL 파라미터로 전달)
    # frontend_url = settings.FRONTEND_URL  # settings.py에 FRONTEND_URL을 정의해야 합니다
    frontend_url = "https://localhost:443"
    redirect_url = f"{frontend_url}?access_token={access_token}&refresh_token={str(refresh)}"
    return redirect(redirect_url)



# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
import requests
from django.conf import settings


class LogoutView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        username = request.user.username
        if username in connected_users:
            logger.info(f"User {username} disconnected")
            connected_users.remove(username)
        
        # 여기에 추가적인 로그아웃 로직을 구현할 수 있습니다.
        # 예: 토큰 무효화, 세션 삭제 등
        
        return Response({"status": "success", "message": "Successfully logged out"}, status=status.HTTP_200_OK)