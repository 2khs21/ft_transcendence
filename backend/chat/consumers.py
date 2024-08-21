#chat/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model


class ChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.User = get_user_model()

    async def connect(self):
        self.room_group_name = 'chat_global'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        username = text_data_json['username']
        to_username = text_data_json.get('to_username', 'everyone')
        whisper = text_data_json.get('whisper', False)
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': username,
                'to_username': to_username,
                'whisper': whisper,
            }
        )

    async def chat_message(self, event):
        # 필수 키들을 가져옴. 존재하지 않을 경우 기본값을 설정
        message = event.get('message', 'No message')
        username = event.get('username', 'Unknown')
        to_username = event.get('to_username', 'everyone')  # 기본값을 설정해 오류 방지
        whisper = event.get('whisper', False)  # 기본값 False로 설정


        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'username': username,
            'to_username': to_username,
            'whisper' : whisper, 
        }))
