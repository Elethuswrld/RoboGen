import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// Store connected clients and their state
const clients = new Map<WebSocket, { authenticated: boolean; accountId?: string }>();

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if this is a WebSocket upgrade request
  if (upgradeHeader.toLowerCase() !== "websocket") {
    // Handle REST API for status checks
    if (req.method === 'GET') {
      return new Response(JSON.stringify({ 
        status: 'online',
        clients: clients.size,
        timestamp: Date.now()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  try {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    socket.onopen = () => {
      console.log("MT5 client connected");
      clients.set(socket, { authenticated: false });
      
      // Send welcome message
      socket.send(JSON.stringify({
        type: 'connected',
        payload: {
          timestamp: Date.now(),
          message: 'Connected to MT5 Bridge'
        }
      }));
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received message:", message.type);
        
        const clientState = clients.get(socket);
        
        switch (message.type) {
          case 'auth':
            // Authenticate the connection with API key
            const apiKey = message.payload?.apiKey;
            const expectedKey = Deno.env.get('MT5_BRIDGE_KEY');
            
            // SECURITY: Require MT5_BRIDGE_KEY to be configured - no bypass allowed
            if (!expectedKey) {
              console.error('MT5_BRIDGE_KEY secret is not configured');
              socket.send(JSON.stringify({
                type: 'auth_failed',
                payload: { error: 'Server not configured for authentication' }
              }));
              break;
            }
            
            if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 8) {
              socket.send(JSON.stringify({
                type: 'auth_failed',
                payload: { error: 'Invalid API key format' }
              }));
              break;
            }
            
            if (apiKey === expectedKey) {
              clients.set(socket, { ...clientState!, authenticated: true, accountId: message.payload?.accountId });
              socket.send(JSON.stringify({
                type: 'auth_success',
                payload: { timestamp: Date.now() }
              }));
            } else {
              socket.send(JSON.stringify({
                type: 'auth_failed',
                payload: { error: 'Invalid API key' }
              }));
            }
            break;

          case 'tick':
            // Broadcast tick data to all authenticated clients
            broadcastToClients(socket, {
              type: 'tick',
              payload: message.payload
            });
            break;

          case 'candle':
            // Broadcast candle data
            broadcastToClients(socket, {
              type: 'candle',
              payload: message.payload
            });
            break;

          case 'account_update':
            // Broadcast account updates
            broadcastToClients(socket, {
              type: 'account_update',
              payload: message.payload
            });
            break;

          case 'order_update':
            // Broadcast order updates
            broadcastToClients(socket, {
              type: 'order_update',
              payload: message.payload
            });
            break;

          case 'order_request':
            // Process order request from dashboard
            if (!clientState?.authenticated) {
              socket.send(JSON.stringify({
                type: 'error',
                payload: { error: 'Not authenticated' }
              }));
              break;
            }
            
            // Validate and forward order to MT5 EA
            const order = message.payload;
            console.log("Processing order:", order);
            
            // Broadcast order request to EA clients
            broadcastToClients(socket, {
              type: 'order_request',
              payload: {
                ...order,
                correlationId: crypto.randomUUID(),
                timestamp: Date.now()
              }
            });
            break;

          case 'order_result':
            // EA sends order execution result
            broadcastToClients(socket, {
              type: 'order_result',
              payload: message.payload
            });
            break;

          case 'ping':
            socket.send(JSON.stringify({
              type: 'pong',
              payload: { timestamp: Date.now() }
            }));
            break;

          case 'subscribe':
            // Subscribe to specific symbols/timeframes
            socket.send(JSON.stringify({
              type: 'subscribed',
              payload: {
                symbols: message.payload?.symbols || [],
                timeframes: message.payload?.timeframes || []
              }
            }));
            break;

          case 'start_trading':
            broadcastToClients(socket, {
              type: 'command',
              payload: { action: 'start', timestamp: Date.now() }
            });
            break;

          case 'stop_trading':
            broadcastToClients(socket, {
              type: 'command',
              payload: { action: 'stop', timestamp: Date.now() }
            });
            break;

          case 'kill_switch':
            // Emergency stop - broadcast to all
            for (const [client] of clients) {
              client.send(JSON.stringify({
                type: 'kill_switch',
                payload: { timestamp: Date.now(), reason: message.payload?.reason }
              }));
            }
            break;

          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("Error processing message:", error);
        socket.send(JSON.stringify({
          type: 'error',
          payload: { error: 'Invalid message format' }
        }));
      }
    };

    socket.onclose = () => {
      console.log("MT5 client disconnected");
      clients.delete(socket);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      clients.delete(socket);
    };

    return response;
  } catch (error) {
    console.error("WebSocket upgrade failed:", error);
    return new Response("WebSocket upgrade failed", { 
      status: 500,
      headers: corsHeaders 
    });
  }
});

function broadcastToClients(sender: WebSocket, message: any) {
  const messageStr = JSON.stringify(message);
  for (const [client, state] of clients) {
    if (client !== sender && client.readyState === WebSocket.OPEN && state.authenticated) {
      client.send(messageStr);
    }
  }
}
