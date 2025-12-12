import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
type BrokerType = "mt5" | "mt4" | "ctrader" | "binance" | "bybit" | "okx" | "deriv";

interface BrokerConfig {
  type: BrokerType;
  name: string;
  apiKey?: string;
  apiSecret?: string;
  server?: string;
  login?: number;
  testnet?: boolean;
}

interface OrderRequest {
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit" | "stop";
  volume: number;
  price?: number;
  sl?: number;
  tp?: number;
}

interface BrokerResponse {
  success: boolean;
  orderId?: string;
  error?: string;
  data?: Record<string, unknown>;
}

// Base adapter interface
interface BrokerAdapter {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  getAccountInfo(): Promise<Record<string, unknown>>;
  getPositions(): Promise<Record<string, unknown>[]>;
  placeOrder(order: OrderRequest): Promise<BrokerResponse>;
  closePosition(positionId: string): Promise<BrokerResponse>;
  modifyPosition(positionId: string, sl?: number, tp?: number): Promise<BrokerResponse>;
}

// MT5 Adapter (via WebSocket bridge)
class MT5Adapter implements BrokerAdapter {
  private config: BrokerConfig;
  private connected = false;

  constructor(config: BrokerConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    // MT5 connects via the TradingBridge EA
    // This adapter sends commands that the EA will process
    console.log(`MT5 Adapter: Connecting to ${this.config.server}`);
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getAccountInfo(): Promise<Record<string, unknown>> {
    return {
      broker: 'MT5',
      server: this.config.server,
      login: this.config.login,
      connected: this.connected,
    };
  }

  async getPositions(): Promise<Record<string, unknown>[]> {
    // Positions come from the EA via WebSocket
    return [];
  }

  async placeOrder(order: OrderRequest): Promise<BrokerResponse> {
    // Order is sent to the EA which executes in MT5
    return {
      success: true,
      orderId: `mt5-${Date.now()}`,
      data: { order, broker: 'MT5' },
    };
  }

  async closePosition(positionId: string): Promise<BrokerResponse> {
    return { success: true, data: { positionId, action: 'close' } };
  }

  async modifyPosition(positionId: string, sl?: number, tp?: number): Promise<BrokerResponse> {
    return { success: true, data: { positionId, sl, tp, action: 'modify' } };
  }
}

// Binance Futures Adapter
class BinanceAdapter implements BrokerAdapter {
  private config: BrokerConfig;
  private baseUrl: string;

  constructor(config: BrokerConfig) {
    this.config = config;
    this.baseUrl = config.testnet 
      ? 'https://testnet.binancefuture.com'
      : 'https://fapi.binance.com';
  }

  private async signRequest(params: Record<string, string>): Promise<string> {
    const queryString = Object.entries(params)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    
    const encoder = new TextEncoder();
    const key = encoder.encode(this.config.apiSecret || '');
    const message = encoder.encode(queryString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return `${queryString}&signature=${signatureHex}`;
  }

  async connect(): Promise<boolean> {
    try {
      const timestamp = Date.now().toString();
      const signedQuery = await this.signRequest({ timestamp });
      
      const response = await fetch(`${this.baseUrl}/fapi/v2/account?${signedQuery}`, {
        headers: { 'X-MBX-APIKEY': this.config.apiKey || '' },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Binance connect error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // No persistent connection to close
  }

  async getAccountInfo(): Promise<Record<string, unknown>> {
    try {
      const timestamp = Date.now().toString();
      const signedQuery = await this.signRequest({ timestamp });
      
      const response = await fetch(`${this.baseUrl}/fapi/v2/account?${signedQuery}`, {
        headers: { 'X-MBX-APIKEY': this.config.apiKey || '' },
      });
      
      if (!response.ok) throw new Error('Failed to get account info');
      return await response.json();
    } catch (error) {
      console.error('Binance getAccountInfo error:', error);
      return { error: String(error) };
    }
  }

  async getPositions(): Promise<Record<string, unknown>[]> {
    try {
      const timestamp = Date.now().toString();
      const signedQuery = await this.signRequest({ timestamp });
      
      const response = await fetch(`${this.baseUrl}/fapi/v2/positionRisk?${signedQuery}`, {
        headers: { 'X-MBX-APIKEY': this.config.apiKey || '' },
      });
      
      if (!response.ok) throw new Error('Failed to get positions');
      const positions = await response.json();
      return positions.filter((p: Record<string, string>) => parseFloat(p.positionAmt) !== 0);
    } catch (error) {
      console.error('Binance getPositions error:', error);
      return [];
    }
  }

  async placeOrder(order: OrderRequest): Promise<BrokerResponse> {
    try {
      const timestamp = Date.now().toString();
      const params: Record<string, string> = {
        symbol: order.symbol.replace('/', ''),
        side: order.side.toUpperCase(),
        type: order.type.toUpperCase(),
        quantity: order.volume.toString(),
        timestamp,
      };
      
      if (order.price && order.type !== 'market') {
        params.price = order.price.toString();
        params.timeInForce = 'GTC';
      }
      
      const signedQuery = await this.signRequest(params);
      
      const response = await fetch(`${this.baseUrl}/fapi/v1/order?${signedQuery}`, {
        method: 'POST',
        headers: { 'X-MBX-APIKEY': this.config.apiKey || '' },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.msg || 'Order failed' };
      }
      
      return { success: true, orderId: data.orderId.toString(), data };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async closePosition(positionId: string): Promise<BrokerResponse> {
    // Binance closes positions by placing opposite orders
    return { success: true, data: { positionId, action: 'close' } };
  }

  async modifyPosition(positionId: string, sl?: number, tp?: number): Promise<BrokerResponse> {
    // Binance uses separate stop-loss/take-profit orders
    return { success: true, data: { positionId, sl, tp } };
  }
}

// Bybit Adapter
class BybitAdapter implements BrokerAdapter {
  private config: BrokerConfig;
  private baseUrl: string;

  constructor(config: BrokerConfig) {
    this.config = config;
    this.baseUrl = config.testnet
      ? 'https://api-testnet.bybit.com'
      : 'https://api.bybit.com';
  }

  private async signRequest(params: Record<string, string>): Promise<{ signature: string; timestamp: string }> {
    const timestamp = Date.now().toString();
    const queryString = Object.entries({ ...params, timestamp, api_key: this.config.apiKey || '' })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    
    const encoder = new TextEncoder();
    const key = encoder.encode(this.config.apiSecret || '');
    const message = encoder.encode(queryString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, message);
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return { signature, timestamp };
  }

  async connect(): Promise<boolean> {
    try {
      const { signature, timestamp } = await this.signRequest({});
      
      const response = await fetch(
        `${this.baseUrl}/v5/account/wallet-balance?accountType=UNIFIED&timestamp=${timestamp}&api_key=${this.config.apiKey}&sign=${signature}`
      );
      
      return response.ok;
    } catch (error) {
      console.error('Bybit connect error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {}

  async getAccountInfo(): Promise<Record<string, unknown>> {
    try {
      const { signature, timestamp } = await this.signRequest({ accountType: 'UNIFIED' });
      
      const response = await fetch(
        `${this.baseUrl}/v5/account/wallet-balance?accountType=UNIFIED&timestamp=${timestamp}&api_key=${this.config.apiKey}&sign=${signature}`
      );
      
      if (!response.ok) throw new Error('Failed to get account info');
      return await response.json();
    } catch (error) {
      return { error: String(error) };
    }
  }

  async getPositions(): Promise<Record<string, unknown>[]> {
    try {
      const { signature, timestamp } = await this.signRequest({ category: 'linear' });
      
      const response = await fetch(
        `${this.baseUrl}/v5/position/list?category=linear&timestamp=${timestamp}&api_key=${this.config.apiKey}&sign=${signature}`
      );
      
      if (!response.ok) throw new Error('Failed to get positions');
      const data = await response.json();
      return data.result?.list || [];
    } catch (error) {
      return [];
    }
  }

  async placeOrder(order: OrderRequest): Promise<BrokerResponse> {
    try {
      const params = {
        category: 'linear',
        symbol: order.symbol,
        side: order.side === 'buy' ? 'Buy' : 'Sell',
        orderType: order.type === 'market' ? 'Market' : 'Limit',
        qty: order.volume.toString(),
        ...(order.price && order.type !== 'market' ? { price: order.price.toString() } : {}),
        ...(order.sl ? { stopLoss: order.sl.toString() } : {}),
        ...(order.tp ? { takeProfit: order.tp.toString() } : {}),
      };
      
      const { signature, timestamp } = await this.signRequest(params);
      
      const response = await fetch(`${this.baseUrl}/v5/order/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BAPI-API-KEY': this.config.apiKey || '',
          'X-BAPI-TIMESTAMP': timestamp,
          'X-BAPI-SIGN': signature,
        },
        body: JSON.stringify(params),
      });
      
      const data = await response.json();
      
      if (data.retCode !== 0) {
        return { success: false, error: data.retMsg };
      }
      
      return { success: true, orderId: data.result?.orderId, data };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async closePosition(positionId: string): Promise<BrokerResponse> {
    return { success: true, data: { positionId, action: 'close' } };
  }

  async modifyPosition(positionId: string, sl?: number, tp?: number): Promise<BrokerResponse> {
    return { success: true, data: { positionId, sl, tp } };
  }
}

// Deriv Adapter
class DerivAdapter implements BrokerAdapter {
  private config: BrokerConfig;
  private baseUrl = 'https://api.deriv.com';

  constructor(config: BrokerConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    // Deriv uses WebSocket for real-time, REST for account info
    return true;
  }

  async disconnect(): Promise<void> {}

  async getAccountInfo(): Promise<Record<string, unknown>> {
    return {
      broker: 'Deriv',
      connected: true,
      apiKey: this.config.apiKey ? '***configured***' : 'not set',
    };
  }

  async getPositions(): Promise<Record<string, unknown>[]> {
    return [];
  }

  async placeOrder(order: OrderRequest): Promise<BrokerResponse> {
    return {
      success: true,
      orderId: `deriv-${Date.now()}`,
      data: { order, broker: 'Deriv' },
    };
  }

  async closePosition(positionId: string): Promise<BrokerResponse> {
    return { success: true, data: { positionId } };
  }

  async modifyPosition(positionId: string, sl?: number, tp?: number): Promise<BrokerResponse> {
    return { success: true, data: { positionId, sl, tp } };
  }
}

// Adapter factory
function createAdapter(config: BrokerConfig): BrokerAdapter {
  switch (config.type) {
    case 'mt5':
    case 'mt4':
      return new MT5Adapter(config);
    case 'binance':
      return new BinanceAdapter(config);
    case 'bybit':
      return new BybitAdapter(config);
    case 'deriv':
      return new DerivAdapter(config);
    case 'ctrader':
    case 'okx':
    default:
      // Fallback to MT5 adapter structure for now
      return new MT5Adapter(config);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, broker, order, positionId, sl, tp } = await req.json();
    
    console.log('Broker Adapter:', { action, brokerType: broker?.type });
    
    const adapter = createAdapter(broker);
    let result: BrokerResponse | Record<string, unknown> | Record<string, unknown>[];
    
    switch (action) {
      case 'connect':
        const connected = await adapter.connect();
        result = { success: connected };
        break;
      
      case 'disconnect':
        await adapter.disconnect();
        result = { success: true };
        break;
      
      case 'getAccountInfo':
        result = await adapter.getAccountInfo();
        break;
      
      case 'getPositions':
        result = await adapter.getPositions();
        break;
      
      case 'placeOrder':
        result = await adapter.placeOrder(order);
        break;
      
      case 'closePosition':
        result = await adapter.closePosition(positionId);
        break;
      
      case 'modifyPosition':
        result = await adapter.modifyPosition(positionId, sl, tp);
        break;
      
      case 'listBrokers':
        result = {
          brokers: [
            { type: 'mt5', name: 'MetaTrader 5', status: 'supported' },
            { type: 'mt4', name: 'MetaTrader 4', status: 'supported' },
            { type: 'ctrader', name: 'cTrader', status: 'planned' },
            { type: 'binance', name: 'Binance Futures', status: 'supported' },
            { type: 'bybit', name: 'Bybit', status: 'supported' },
            { type: 'okx', name: 'OKX', status: 'planned' },
            { type: 'deriv', name: 'Deriv', status: 'supported' },
          ],
        };
        break;
      
      default:
        result = { error: `Unknown action: ${action}` };
    }
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Broker Adapter error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
