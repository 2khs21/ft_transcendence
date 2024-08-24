#chat/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
import asyncio # time out을 위해 asyncio를 사용
from channels.db import database_sync_to_async
from django.utils import timezone

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'chat_global'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print('connect')
        # for timeout
        self.user = self.scope["user"]

        if self.user.is_authenticated:
            await self.update_user_status(True)
            self.timeout_task = asyncio.create_task(self.check_timeout())

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        # for timeout
        print('disconnect')
        if self.user.is_authenticated:
            await self.update_user_status(False)
            # 타임아웃 체크 태스크 취소
            if hasattr(self, 'timeout_task'):
                self.timeout_task.cancel()

    async def receive(self, text_data):
        if self.user.is_authenticated:
            await self.update_last_activity() # for timeout
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

    @database_sync_to_async
    def update_user_status(self, is_online):
        self.user.is_online = is_online
        self.user.save()

    @database_sync_to_async
    def update_last_activity(self):
        self.user.last_activity = timezone.now()
        self.user.save()

    async def check_timeout(self):
        while True:
            await asyncio.sleep(30)  # 30초마다 체크
            if self.user.is_authenticated:
                last_activity = await database_sync_to_async(lambda: self.user.last_activity)()
                if (timezone.now() - last_activity).total_seconds() > 30:
                    await self.close()
                    break

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