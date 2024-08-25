from django.contrib.auth.models import User #User 모델을 사용하기 위함
from django.contrib.auth.password_validation import validate_password
# 장고의 기본 패스워드 검증 도구

from rest_framework import serializers
from rest_framework.authtoken.models import Token # Token 모델
from rest_framework.validators import UniqueValidator # 이메일 중복 방지를 위한 도구
from django.contrib.auth import authenticate
# Django의 기본 authenticate 함수
# 우리가 설정한 DefaultAuthBackend인 TokenAuth 방식으로 유저를 인증해줌

from django.contrib.auth import get_user_model
User = get_user_model()  # 현재 프로젝트의 User 모델을 가져옵니다.

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class EmailVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)
    
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if user and user.is_active:
            return data
        raise serializers.ValidationError("Unable to log in with provided credentials.")

###################### follow ######################
class FollowSerializer(serializers.Serializer):
    username = serializers.CharField()

    def validate_username(self, value):
        """
        입력된 username이 실제로 존재하는지 검증합니다.
        """
        try:
            User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")
        return value
    
###################### profile ######################	
class UserProfileSerializer(serializers.ModelSerializer):
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        exclude = ['password']  # 비밀번호 필드를 제외한 모든 필드

    def get_profile_image_url(self, obj):
        return obj.get_profile_image_url()
    

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        exclude = ['password']  # 비밀번호 필드를 제외한 모든 필드

class FriendSerializer(serializers.Serializer):
    username = serializers.CharField()
    action = serializers.ChoiceField(choices=['add', 'remove'])

class MuteSerializer(serializers.Serializer):
    username = serializers.CharField()
    action = serializers.ChoiceField(choices=['mute', 'unmute'])



################# record #################
    
from .models import PongRecord
class PongRecordSerializer(serializers.ModelSerializer):
    winner = serializers.CharField(write_only=True)
    loser = serializers.CharField(write_only=True)
    winner_username = serializers.CharField(source='winner.username', read_only=True)
    loser_username = serializers.CharField(source='loser.username', read_only=True)

    class Meta:
        model = PongRecord
        fields = ['id', 'winner', 'loser', 'winner_username', 'loser_username', 'end_time']
        read_only_fields = ['id', 'end_time', 'winner_username', 'loser_username']

    def validate(self, data):
        if data['winner'] == data['loser']:
            raise serializers.ValidationError("승자와 패자는 같을 수 없습니다.")
        return data

    def create(self, validated_data):
        winner_username = validated_data.pop('winner')
        loser_username = validated_data.pop('loser')

        try:
            winner = User.objects.get(username=winner_username)
            loser = User.objects.get(username=loser_username)
        except User.DoesNotExist:
            raise serializers.ValidationError("입력한 사용자 이름이 존재하지 않습니다.")

        pong_record = PongRecord.objects.create(
            winner=winner,
            loser=loser,
            **validated_data
        )
        return pong_record