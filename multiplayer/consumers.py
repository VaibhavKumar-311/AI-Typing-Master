import json
import time
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core.cache import cache

class MultiplayerConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_code = self.scope['url_route']['kwargs']['room_code']
        self.room_group_name = f'race_{self.room_code}'
        self.user = self.scope["user"]

        if not self.user.is_authenticated:
            await self.close()
            return

        # Anti-ghosting/Reconnect logic
        self.player_state_key = f"room_{self.room_code}_player_{self.user.username}"
        
        # Initialize or fetch server-authoritative state
        state = cache.get(self.player_state_key)
        if not state:
            state = {
                'progress': 0,
                'last_update_time': time.time(),
                'is_ready': False,
                'is_finished': False
            }
            cache.set(self.player_state_key, state, 3600)

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_joined',
                'username': self.user.username,
                'progress': state['progress'],
                'is_ready': state['is_ready']
            }
        )

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            # We do NOT instantly destroy the player state.
            # Give a 15 second grace period. If they don't reconnect, frontend can mark offline.
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'player_disconnected',
                    'username': self.user.username
                }
            )
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        event_type = data.get('type')
        
        state = cache.get(self.player_state_key)
        if not state:
            return
            
        if event_type == 'progress_update':
            progress = float(data.get('progress', 0))
            wpm = int(data.get('wpm', 0))
            current_time = time.time()
            
            # Anti-Cheat: Validate impossible progress jumps
            time_delta = current_time - state['last_update_time']
            progress_delta = progress - state['progress']
            
            # Theoretical max typing speed is ~300 WPM (25 chars/sec)
            # If paragraph is 100 chars, max progress is 25% per sec.
            # We allow up to 40% per sec jump to account for network buffer bursts.
            if progress_delta > 0 and time_delta > 0:
                if (progress_delta / time_delta) > 50.0 or wpm > 300:
                    # Anomaly detected, reject update
                    return 
            
            state['progress'] = progress
            state['last_update_time'] = current_time
            cache.set(self.player_state_key, state, 3600)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'race_update',
                    'username': self.user.username,
                    'progress': progress,
                    'wpm': wpm
                }
            )
            
            # Atomic Placement check
            if progress >= 100 and not state['is_finished']:
                state['is_finished'] = True
                cache.set(self.player_state_key, state, 3600)
                
                # Fetch atomic placement from cache counter
                placement_key = f"room_{self.room_code}_placements"
                placement = cache.get(placement_key, 0) + 1
                cache.set(placement_key, placement, 3600)
                
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'race_finish',
                        'username': self.user.username,
                        'placement': placement
                    }
                )
            
        elif event_type == 'player_ready':
            state['is_ready'] = True
            cache.set(self.player_state_key, state, 3600)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'player_ready_state',
                    'username': self.user.username,
                    'is_ready': True
                }
            )
            
        elif event_type == 'start_countdown':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'race_countdown',
                    'countdown': 3
                }
            )

    async def player_joined(self, event):
        await self.send(text_data=json.dumps(event))
        
    async def player_disconnected(self, event):
        await self.send(text_data=json.dumps(event))
        
    async def race_update(self, event):
        await self.send(text_data=json.dumps(event))
        
    async def player_ready_state(self, event):
        await self.send(text_data=json.dumps(event))
        
    async def race_countdown(self, event):
        await self.send(text_data=json.dumps({
            'type': 'start_countdown',
            'countdown': event['countdown']
        }))
        
    async def race_finish(self, event):
        await self.send(text_data=json.dumps(event))
