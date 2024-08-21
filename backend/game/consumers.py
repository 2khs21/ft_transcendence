# game/consumers.py
import json
import uuid

import socket
import asyncio

from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model

# Open UDP receiving socket
# udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
# udp_socket.bind(('', 0))
# udp_port = struct.pack("!H", socket.htons(udp_socket.getsockname()[1]))
# udp_port_bigendian = struct.unpack("!H", udp_port)[0]

# print(f"UDP port: {udp_port}")

# Connect TCP 127.0.0.1:9180
# gameServerSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
# gameServerSocket.connect(('gameserver', 9180))

SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600

# Ball and paddle dimensions
BALL_SIZE = 20
BALL_SPEED = 400
PADDLE_WIDTH = 5
PADDLE_HEIGHT = 300
PADDLE_SPEED = 400
PADDLE_OFFSET = 100


dualQueue = []

# 4 players
tournamentQueue = []

# enqueue 4 players
# enqueue 2 winners
tournamentDualQueue = []

class GameConsumer(AsyncWebsocketConsumer):  # GameConsumer 클래스는 AsyncWebSocketConsumer를 상속받아 WebSocket 통신과 Pong 게임 로직을 구현합니다.

    async def connect(self):  # 클라이언트가 WebSocket 연결을 시도할 때 호출되는 메서드입니다.

        # 조건 없이 수락

        # WebSocket 연결 수락
        await self.accept()

    async def disconnect(self, close_code):  # 클라이언트가 WebSocket 연결을 끊을 때 호출되는 메서드입니다.
        # 그룹에서 현재 WebSocket 채널을 제거합니다. 연결이 끊길 때 해당 그룹에서 이 클라이언트가 나가게 됩니다.
        await self.channel_layer.group_discard(
            self.room_group_name,  # 연결이 종료된 WebSocket 채널이 속한 그룹 이름을 전달합니다.
            self.channel_name  # 현재 WebSocket 채널을 그룹에서 제거합니다.
        )

    # 클라이언트로부터 메시지를 수신할 때 호출됩니다.
    async def receive(self, text_data):  # WebSocket을 통해 클라이언트로부터 데이터를 수신할 때 실행됩니다.
        data = json.loads(text_data)  # 수신한 텍스트 데이터를 JSON 형식으로 파싱합니다.
        action = data['type']  # 파싱된 데이터에서 'type' 필드를 추출합니다. 이 필드는 클라이언트에서 전송된 게임 액션(예: 패들 이동)을 나타냅니다.

        if action == 'actionPlayerInput':
            # SessionID	uint32_t	4	Unique session ID
            # PlayerID	uint32_t	4	The ID of the player who sends the input
            # - 1: Player A
            # - 2: Player B
            # InputKey	uint8_t	1	The input key of the player
            # - 0: None
            # - 1: Left
            # - 2: Right
            # InputType	uint8_t	1	The input type of the player
            # - 0: None
            # - 1: Press
            # - 2: Release
            sessionID = data['sessionID']
            playerID = data['playerID']
            inputKey = data['inputKey']
            inputType = data['inputType']

            # Send input to game server
            # gameServerSocket.send(struct.pack("!IIII", sessionID, playerID, inputKey, inputType))
            # get recv from game server in UDP
            # 게임서버 참조
            # recv_data, addr = udp_socket.recvfrom(1024)



        elif action == 'dualJoin':
            # global을 붙인 이유는 함수 내에서 전역 변수를 수정하기 위함
            global dualQueue

            requester = data['username']

            roomname = ""


            if (len(dualQueue) == 0):
                dualQueue.append(self)
                roomname = uuid.uuid4().hex
                player1 = requester


            elif (len(dualQueue) == 1):
                dualQueue.append(self)


           
        elif action == 'tounamentJoin':
            global tournamentQueue
            tournamentQueue.append(self)



            



    # # 그룹에서 메시지를 수신할 때 호출됩니다.
    # async def game_update(self, event):  # 그룹에서 수신한 'game_update' 유형의 메시지를 처리합니다.
    #     action = event['action']  # 이벤트 객체에서 'action' 데이터를 추출합니다. 이 데이터는 그룹에서 전달된 게임 액션을 나타냅니다.

    #     # WebSocket을 통해 클라이언트로 데이터를 전송합니다.
    #     await self.send(text_data=json.dumps({
    #         'action': action  # 클라이언트로 전송할 데이터를 JSON 형식으로 변환합니다. 이 경우 게임 액션을 전송합니다.
    #     }))
