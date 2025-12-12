import { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectionStatus, Candle, Position, AccountInfo } from '@/types/trading';
import { useToast } from '@/hooks/use-toast';

const WS_URL = `wss://zedwxfsqoeygiuzdgwfi.functions.supabase.co/mt5-bridge`;

interface MT5Message {
  type: string;
  payload: any;
}

interface Log {
  time: number;
  level: string;
  message: string;
}

export const useMT5Connection = () => {
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [isTrading, setIsTrading] = useState(false);

  const addLog = useCallback((message: string, level: string = 'info') => {
    const log: Log = {
      time: Date.now(),
      level,
      message,
    };
    setLogs(prev => [log, ...prev.slice(0, 99)]);
  }, []);

  const connect = useCallback((apiKey?: string) => {
    // SECURITY: Require API key - no default fallback
    if (!apiKey || apiKey.length < 8) {
      addLog('API key is required to connect');
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: "A valid API key is required to connect",
        variant: "destructive",
      });
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      addLog('Already connected');
      return;
    }

    setConnectionStatus('connecting');
    addLog('Connecting to MT5 bridge...');

    try {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
        addLog('Connected to MT5 bridge');
        
        // Authenticate with provided API key
        wsRef.current?.send(JSON.stringify({
          type: 'auth',
          payload: { apiKey }
        }));

        // Start ping interval
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);

        toast({
          title: "Connected",
          description: "Successfully connected to MT5 bridge",
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: MT5Message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected');
        setIsTrading(false);
        addLog('Disconnected from MT5 bridge');
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Auto-reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          addLog('Attempting to reconnect...');
          connect(apiKey);
        }, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        addLog('Connection error occurred');
        
        toast({
          title: "Connection Error",
          description: "Failed to connect to MT5 bridge",
          variant: "destructive",
        });
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionStatus('error');
      addLog('Failed to create connection');
    }
  }, [addLog, toast]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    setIsTrading(false);
    addLog('Disconnected manually');
  }, [addLog]);

  const handleMessage = useCallback((message: MT5Message) => {
    switch (message.type) {
      case 'connected':
        addLog('Received welcome from server');
        break;

      case 'auth_success':
        addLog('Authentication successful');
        break;

      case 'auth_failed':
        addLog(`Authentication failed: ${message.payload?.error}`);
        setConnectionStatus('error');
        break;

      case 'tick':
        // Update latest price
        addLog(`Tick: ${message.payload?.symbol} ${message.payload?.bid}/${message.payload?.ask}`);
        break;

      case 'candle':
        setCandles(prev => {
          const newCandle = message.payload as Candle;
          const existing = prev.findIndex(c => c.time === newCandle.time && c.symbol === newCandle.symbol);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = newCandle;
            return updated;
          }
          return [...prev.slice(-99), newCandle];
        });
        break;

      case 'account_update':
        setAccountInfo(message.payload as AccountInfo);
        addLog(`Account update: Balance ${message.payload?.balance}`);
        break;

      case 'order_update':
        const position = message.payload as Position;
        setPositions(prev => {
          const existing = prev.findIndex(p => p.ticket === position.ticket);
          if (position.status === 'closed') {
            return prev.filter(p => p.ticket !== position.ticket);
          }
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = position;
            return updated;
          }
          return [...prev, position];
        });
        addLog(`Order ${position.ticket}: ${position.status}`);
        break;

      case 'order_result':
        addLog(`Order result: ${JSON.stringify(message.payload)}`);
        toast({
          title: message.payload?.success ? "Order Executed" : "Order Failed",
          description: message.payload?.message || `Ticket: ${message.payload?.ticket}`,
          variant: message.payload?.success ? "default" : "destructive",
        });
        break;

      case 'command':
        if (message.payload?.action === 'start') {
          setIsTrading(true);
          addLog('Trading started');
        } else if (message.payload?.action === 'stop') {
          setIsTrading(false);
          addLog('Trading stopped');
        }
        break;

      case 'kill_switch':
        setIsTrading(false);
        addLog(`KILL SWITCH ACTIVATED: ${message.payload?.reason || 'Emergency stop'}`);
        toast({
          title: "Kill Switch Activated",
          description: "All trading has been stopped",
          variant: "destructive",
        });
        break;

      case 'pong':
        // Heartbeat received
        break;

      case 'error':
        addLog(`Error: ${message.payload?.error}`);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [addLog, toast]);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
      return true;
    }
    addLog('Cannot send message: not connected');
    return false;
  }, [addLog]);

  const startTrading = useCallback(() => {
    if (sendMessage('start_trading', {})) {
      setIsTrading(true);
      addLog('Starting trading...');
    }
  }, [sendMessage, addLog]);

  const stopTrading = useCallback(() => {
    if (sendMessage('stop_trading', {})) {
      setIsTrading(false);
      addLog('Stopping trading...');
    }
  }, [sendMessage, addLog]);

  const activateKillSwitch = useCallback((reason?: string) => {
    sendMessage('kill_switch', { reason });
    setIsTrading(false);
    addLog('Kill switch activated!');
  }, [sendMessage, addLog]);

  const sendOrder = useCallback((order: {
    symbol: string;
    side: 'buy' | 'sell';
    volume: number;
    sl?: number;
    tp?: number;
  }) => {
    return sendMessage('order_request', order);
  }, [sendMessage]);

  const closePosition = useCallback((ticket: number) => {
    return sendMessage('order_request', {
      type: 'close',
      ticket
    });
  }, [sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    connectionStatus,
    accountInfo,
    positions,
    candles,
    logs,
    isTrading,
    connect,
    disconnect,
    startTrading,
    stopTrading,
    activateKillSwitch,
    sendOrder,
    closePosition,
    sendMessage,
  };
};
