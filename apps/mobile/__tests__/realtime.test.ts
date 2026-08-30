import { REALTIME_ALL_CHANNEL } from '../src/realtime/types';
import {
  createNoopRealtimeClient,
  hasRealtimeClient,
  registerRealtimeClient,
} from '../src/realtime/realtimeClient';

describe('Realtime skeleton', () => {
  afterEach(() => {
    registerRealtimeClient(null);
  });

  it('registry starts empty (no transport shipped by the Foundation)', () => {
    expect(hasRealtimeClient()).toBe(false);
    registerRealtimeClient(createNoopRealtimeClient());
    expect(hasRealtimeClient()).toBe(true);
  });

  it('connects and reports state transitions', async () => {
    const client = createNoopRealtimeClient();
    const seen: string[] = [];
    client.onConnectionStateChange((state) => seen.push(state));
    await client.connect();
    expect(client.getConnectionState()).toBe('open');
    expect(seen).toEqual(['connecting', 'open']);
    await client.disconnect();
    expect(client.getConnectionState()).toBe('closed');
  });

  it('delivers payloads to channel subscribers and supports unsubscribe', async () => {
    const client = createNoopRealtimeClient();
    const received: unknown[] = [];
    const sub = client.subscribe('chat.room', (event) => received.push(event.payload));
    client.send('chat.room', { hello: 1 });
    sub.unsubscribe();
    client.send('chat.room', { hello: 2 });
    expect(received).toEqual([{ hello: 1 }]);
  });

  it('supports the wildcard channel', async () => {
    const client = createNoopRealtimeClient();
    const all: string[] = [];
    client.subscribe(REALTIME_ALL_CHANNEL, (event) => all.push(event.channel));
    client.send('a', 1);
    client.send('b', 2);
    expect(all).toEqual(['a', 'b']);
  });

  it('exposes only the skeleton surface (no chat protocol)', () => {
    const client = createNoopRealtimeClient();
    const keys = Object.keys(client).sort();
    expect(keys).toEqual(
      ['connect', 'disconnect', 'getConnectionState', 'onConnectionStateChange', 'send', 'subscribe'].sort(),
    );
  });
});
