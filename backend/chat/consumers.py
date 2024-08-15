# chat/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
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

        # 귓속말 처리
        if message.startswith('/w '):
            parts = message.split(' ', 2)
            if len(parts) == 3:
                target_username = parts[1]
                whisper_message = parts[2]
                await self.whisper(username, target_username, whisper_message)
            return

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': username
            }
        )

    async def chat_message(self, event):
        message = event['message']
        username = event['username']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'username': username
        }))

    # async def whisper(self, from_username, to_username, message):
    #     # 대상 사용자 찾기
    #     to_user = await sync_to_async(User.objects.filter)(username=to_username).first()
    #     if to_user:
    #         # 대상 사용자의 채널 이름 찾기 (이 부분은 실제 구현에서 더 복잡할 수 있습니다)
    #         # 여기서는 단순화를 위해 전체 그룹에 보내고 클라이언트에서 필터링하는 방식을 사용합니다
    #         await self.channel_layer.group_send(
    #             self.room_group_name,
    #             {
    #                 'type': 'whisper_message',
    #                 'message': message,
    #                 'from_username': from_username,
    #                 'to_username': to_username
    #             }
    #         )
    #     else:
    #         # 발신자에게 오류 메시지 보내기
    #         await self.send(text_data=json.dumps({
    #             'message': f"User {to_username} not found.",
    #             'username': 'System'
    #         }))

    # async def whisper_message(self, event):
    #     await self.send(text_data=json.dumps({
    #         'whisper': True,
    #         'message': event['message'],
    #         'from_username': event['from_username'],
    #         'to_username': event['to_username']
    #     }))