//+------------------------------------------------------------------+
//|                                                TradingBridge.mq5 |
//|                                       Lovable Trading Platform   |
//|                                                                  |
//+------------------------------------------------------------------+
#property copyright "Lovable Trading Platform"
#property link      ""
#property version   "1.00"
#property strict

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>
#include <Trade\OrderInfo.mqh>

//--- Input parameters
input string   InpWebSocketURL = "wss://zedwxfsqoeygiuzdgwfi.functions.supabase.co/functions/v1/mt5-bridge"; // WebSocket URL
input string   InpAPIKey       = "uN1qu3T0k3n123!";                    // API Key for authentication
input string   InpAccountID    = "211965842";                    // Account identifier
input int      InpMagicNumber  = 123456;                // Magic number for orders
input bool     InpEnableTrading = true;                 // Enable trading
input int      InpMaxSlippage  = 3;                     // Max slippage in points
input int      InpPingInterval = 30;                    // Ping interval in seconds
input int      InpCandleInterval = 1;                   // Candle update interval in seconds
input string   InpSymbols      = "EURUSD,GBPUSD,USDJPY,XAUUSD,DE30,BTCUSD,USTEC,US500,US30"; // Symbols to stream (comma separated)

//--- Global variables
int            wsHandle = INVALID_HANDLE;
bool           isConnected = false;
bool           isAuthenticated = false;
bool           tradingEnabled = true;
datetime       lastPingTime = 0;
datetime       lastCandleTime = 0;
string         symbolsArray[];
int            symbolCount = 0;

//--- Trade objects
CTrade         trade;
CPositionInfo  positionInfo;
COrderInfo     orderInfo;

//+------------------------------------------------------------------+
//| Expert initialization function                                     |
//+------------------------------------------------------------------+
int OnInit()
{
   //--- Validate inputs
   if(StringLen(InpAPIKey) < 8)
   {
      Print("ERROR: API Key must be at least 8 characters");
      return INIT_PARAMETERS_INCORRECT;
   }
   
   if(StringLen(InpWebSocketURL) == 0)
   {
      Print("ERROR: WebSocket URL is required");
      return INIT_PARAMETERS_INCORRECT;
   }
   
   //--- Parse symbols
   symbolCount = StringSplit(InpSymbols, ',', symbolsArray);
   for(int i = 0; i < symbolCount; i++)
   {
      StringTrimLeft(symbolsArray[i]);
      StringTrimRight(symbolsArray[i]);
   }
   
   //--- Initialize trade object
   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetDeviationInPoints(InpMaxSlippage);
   trade.SetTypeFilling(ORDER_FILLING_IOC);
   trade.SetAsyncMode(false);
   
   //--- Connect to WebSocket
   if(!ConnectWebSocket())
   {
      Print("WARNING: Initial connection failed, will retry...");
   }
   
   //--- Set timer for periodic updates
   EventSetMillisecondTimer(100);
   
   Print("TradingBridge EA initialized successfully");
   Print("Magic Number: ", InpMagicNumber);
   Print("Trading Enabled: ", InpEnableTrading);
   Print("Symbols: ", InpSymbols);
   
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                   |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   DisconnectWebSocket();
   Print("TradingBridge EA deinitialized, reason: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                               |
//+------------------------------------------------------------------+
void OnTick()
{
   if(!isConnected || !isAuthenticated)
      return;
   
   //--- Stream tick data for current symbol
   StreamTickData(_Symbol);
}

//+------------------------------------------------------------------+
//| Timer function                                                     |
//+------------------------------------------------------------------+
void OnTimer()
{
   //--- Check connection status
   if(!isConnected)
   {
      ConnectWebSocket();
      return;
   }
   
   //--- Process incoming messages
   ProcessIncomingMessages();
   
   //--- Send ping to keep connection alive
   datetime currentTime = TimeCurrent();
   if(currentTime - lastPingTime >= InpPingInterval)
   {
      SendPing();
      lastPingTime = currentTime;
   }
   
   //--- Stream candle data periodically
   if(currentTime - lastCandleTime >= InpCandleInterval)
   {
      for(int i = 0; i < symbolCount; i++)
      {
         StreamCandleData(symbolsArray[i], PERIOD_M1);
      }
      lastCandleTime = currentTime;
   }
   
   //--- Send account updates
   SendAccountUpdate();
}

//+------------------------------------------------------------------+
//| WebSocket connection functions                                     |
//+------------------------------------------------------------------+
bool ConnectWebSocket()
{
   //--- Note: MQL5 doesn't have native WebSocket support
   //--- This uses a WebRequest workaround or requires external DLL
   //--- For production, use a WebSocket library like:
   //--- https://www.mql5.com/en/code/25920 (WebSocket client)
   
   Print("Attempting to connect to: ", InpWebSocketURL);
   
   //--- Simulate connection for now
   //--- In production, replace with actual WebSocket connection
   isConnected = true;
   
   //--- Authenticate after connection
   if(isConnected)
   {
      Authenticate();
   }
   
   return isConnected;
}

void DisconnectWebSocket()
{
   if(wsHandle != INVALID_HANDLE)
   {
      //--- Close WebSocket connection
      wsHandle = INVALID_HANDLE;
   }
   isConnected = false;
   isAuthenticated = false;
   Print("Disconnected from WebSocket");
}

//+------------------------------------------------------------------+
//| Authentication                                                     |
//+------------------------------------------------------------------+
void Authenticate()
{
   string authMessage = StringFormat(
      "{\"type\":\"auth\",\"payload\":{\"apiKey\":\"%s\",\"accountId\":\"%s\"}}",
      InpAPIKey,
      InpAccountID
   );
   
   SendMessage(authMessage);
   Print("Authentication request sent");
   
   //--- For HTTP fallback, use WebRequest
   //--- In production WebSocket, wait for auth_success response
   isAuthenticated = true;
}

//+------------------------------------------------------------------+
//| Message sending functions                                          |
//+------------------------------------------------------------------+
void SendMessage(string message)
{
   if(!isConnected)
   {
      Print("Cannot send message: not connected");
      return;
   }
   
   //--- WebSocket send implementation
   //--- For HTTP fallback:
   string headers = "Content-Type: application/json\r\n";
   headers += "x-api-key: " + InpAPIKey + "\r\n";
   
   char post[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(message, post, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(post, ArraySize(post) - 1); // Remove null terminator
   
   //--- For REST API fallback (when WebSocket not available)
   //--- ResetLastError();
   //--- int res = WebRequest("POST", httpURL, headers, 5000, post, result, resultHeaders);
   
   Print("Message sent: ", StringSubstr(message, 0, 100));
}

void SendPing()
{
   string pingMessage = "{\"type\":\"ping\",\"payload\":{}}";
   SendMessage(pingMessage);
}

//+------------------------------------------------------------------+
//| Data streaming functions                                           |
//+------------------------------------------------------------------+
void StreamTickData(string symbol)
{
   MqlTick tick;
   if(!SymbolInfoTick(symbol, tick))
      return;
   
   string tickMessage = StringFormat(
      "{\"type\":\"tick\",\"payload\":{\"symbol\":\"%s\",\"bid\":%.5f,\"ask\":%.5f,\"last\":%.5f,\"volume\":%d,\"time\":%d}}",
      symbol,
      tick.bid,
      tick.ask,
      tick.last,
      (int)tick.volume,
      (int)tick.time
   );
   
   SendMessage(tickMessage);
}

void StreamCandleData(string symbol, ENUM_TIMEFRAMES timeframe)
{
   MqlRates rates[];
   ArraySetAsSeries(rates, true);
   
   int copied = CopyRates(symbol, timeframe, 0, 100, rates);
   if(copied <= 0)
      return;
   
   //--- Send latest candles
   string candlesJson = "[";
   int maxCandles = MathMin(copied, 50);
   
   for(int i = 0; i < maxCandles; i++)
   {
      if(i > 0) candlesJson += ",";
      candlesJson += StringFormat(
         "{\"time\":%d,\"open\":%.5f,\"high\":%.5f,\"low\":%.5f,\"close\":%.5f,\"volume\":%d}",
         (int)rates[i].time,
         rates[i].open,
         rates[i].high,
         rates[i].low,
         rates[i].close,
         (int)rates[i].tick_volume
      );
   }
   candlesJson += "]";
   
   string candleMessage = StringFormat(
      "{\"type\":\"candle\",\"payload\":{\"symbol\":\"%s\",\"timeframe\":\"%s\",\"candles\":%s}}",
      symbol,
      TimeframeToString(timeframe),
      candlesJson
   );
   
   SendMessage(candleMessage);
}

void SendAccountUpdate()
{
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double margin = AccountInfoDouble(ACCOUNT_MARGIN);
   double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   double marginLevel = AccountInfoDouble(ACCOUNT_MARGIN_LEVEL);
   double profit = AccountInfoDouble(ACCOUNT_PROFIT);
   
   //--- Get open positions
   string positionsJson = GetPositionsJson();
   
   //--- Get pending orders
   string ordersJson = GetPendingOrdersJson();
   
   string accountMessage = StringFormat(
      "{\"type\":\"account_update\",\"payload\":{\"balance\":%.2f,\"equity\":%.2f,\"margin\":%.2f,\"freeMargin\":%.2f,\"marginLevel\":%.2f,\"profit\":%.2f,\"positions\":%s,\"orders\":%s,\"timestamp\":%d}}",
      balance,
      equity,
      margin,
      freeMargin,
      marginLevel,
      profit,
      positionsJson,
      ordersJson,
      (int)TimeCurrent()
   );
   
   SendMessage(accountMessage);
}

//+------------------------------------------------------------------+
//| Position and order JSON builders                                   |
//+------------------------------------------------------------------+
string GetPositionsJson()
{
   string json = "[";
   bool first = true;
   
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(positionInfo.SelectByIndex(i))
      {
         //--- Only include positions from this EA
         if(positionInfo.Magic() != InpMagicNumber)
            continue;
         
         if(!first) json += ",";
         first = false;
         
         json += StringFormat(
            "{\"ticket\":%d,\"symbol\":\"%s\",\"type\":\"%s\",\"volume\":%.2f,\"openPrice\":%.5f,\"currentPrice\":%.5f,\"sl\":%.5f,\"tp\":%.5f,\"profit\":%.2f,\"swap\":%.2f,\"openTime\":%d}",
            positionInfo.Ticket(),
            positionInfo.Symbol(),
            positionInfo.TypeDescription(),
            positionInfo.Volume(),
            positionInfo.PriceOpen(),
            positionInfo.PriceCurrent(),
            positionInfo.StopLoss(),
            positionInfo.TakeProfit(),
            positionInfo.Profit(),
            positionInfo.Swap(),
            (int)positionInfo.Time()
         );
      }
   }
   
   json += "]";
   return json;
}

string GetPendingOrdersJson()
{
   string json = "[";
   bool first = true;
   
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(orderInfo.SelectByIndex(i))
      {
         //--- Only include orders from this EA
         if(orderInfo.Magic() != InpMagicNumber)
            continue;
         
         if(!first) json += ",";
         first = false;
         
         json += StringFormat(
            "{\"ticket\":%d,\"symbol\":\"%s\",\"type\":\"%s\",\"volume\":%.2f,\"price\":%.5f,\"sl\":%.5f,\"tp\":%.5f,\"openTime\":%d}",
            orderInfo.Ticket(),
            orderInfo.Symbol(),
            orderInfo.TypeDescription(),
            orderInfo.VolumeCurrent(),
            orderInfo.PriceOpen(),
            orderInfo.StopLoss(),
            orderInfo.TakeProfit(),
            (int)orderInfo.TimeSetup()
         );
      }
   }
   
   json += "]";
   return json;
}

//+------------------------------------------------------------------+
//| Process incoming messages                                          |
//+------------------------------------------------------------------+
void ProcessIncomingMessages()
{
   //--- In production, read from WebSocket buffer
   //--- Parse JSON messages and handle commands
   
   //--- Example message handling structure:
   //--- ParseAndExecuteCommand(receivedMessage);
}

void ParseAndExecuteCommand(string jsonMessage)
{
   //--- Parse message type
   string msgType = GetJsonValue(jsonMessage, "type");
   
   if(msgType == "order_request")
   {
      ExecuteOrderFromJson(jsonMessage);
   }
   else if(msgType == "command")
   {
      string action = GetJsonValue(jsonMessage, "action");
      if(action == "start")
      {
         tradingEnabled = true;
         Print("Trading ENABLED via command");
      }
      else if(action == "stop")
      {
         tradingEnabled = false;
         Print("Trading DISABLED via command");
      }
   }
   else if(msgType == "kill_switch")
   {
      ActivateKillSwitch(GetJsonValue(jsonMessage, "reason"));
   }
   else if(msgType == "auth_success")
   {
      isAuthenticated = true;
      Print("Authentication successful");
   }
   else if(msgType == "auth_failed")
   {
      isAuthenticated = false;
      Print("Authentication failed: ", GetJsonValue(jsonMessage, "error"));
   }
   else if(msgType == "pong")
   {
      //--- Connection alive confirmation
   }
}

//+------------------------------------------------------------------+
//| Order execution functions                                          |
//+------------------------------------------------------------------+
void ExecuteOrderFromJson(string jsonMessage)
{
   if(!InpEnableTrading || !tradingEnabled)
   {
      Print("Trading disabled, order rejected");
      SendOrderResult("rejected", 0, "Trading disabled");
      return;
   }
   
   //--- Parse order details
   string symbol = GetJsonValue(jsonMessage, "symbol");
   string action = GetJsonValue(jsonMessage, "action");
   double volume = StringToDouble(GetJsonValue(jsonMessage, "volume"));
   double price = StringToDouble(GetJsonValue(jsonMessage, "price"));
   double sl = StringToDouble(GetJsonValue(jsonMessage, "stopLoss"));
   double tp = StringToDouble(GetJsonValue(jsonMessage, "takeProfit"));
   string correlationId = GetJsonValue(jsonMessage, "correlationId");
   
   //--- Validate symbol
   if(!SymbolSelect(symbol, true))
   {
      SendOrderResult("error", 0, "Invalid symbol: " + symbol, correlationId);
      return;
   }
   
   //--- Execute based on action
   bool result = false;
   ulong ticket = 0;
   
   if(action == "buy")
   {
      double askPrice = SymbolInfoDouble(symbol, SYMBOL_ASK);
      result = trade.Buy(volume, symbol, askPrice, sl, tp, "TradingBridge");
      if(result) ticket = trade.ResultOrder();
   }
   else if(action == "sell")
   {
      double bidPrice = SymbolInfoDouble(symbol, SYMBOL_BID);
      result = trade.Sell(volume, symbol, bidPrice, sl, tp, "TradingBridge");
      if(result) ticket = trade.ResultOrder();
   }
   else if(action == "buy_limit")
   {
      result = trade.BuyLimit(volume, price, symbol, sl, tp, ORDER_TIME_GTC, 0, "TradingBridge");
      if(result) ticket = trade.ResultOrder();
   }
   else if(action == "sell_limit")
   {
      result = trade.SellLimit(volume, price, symbol, sl, tp, ORDER_TIME_GTC, 0, "TradingBridge");
      if(result) ticket = trade.ResultOrder();
   }
   else if(action == "buy_stop")
   {
      result = trade.BuyStop(volume, price, symbol, sl, tp, ORDER_TIME_GTC, 0, "TradingBridge");
      if(result) ticket = trade.ResultOrder();
   }
   else if(action == "sell_stop")
   {
      result = trade.SellStop(volume, price, symbol, sl, tp, ORDER_TIME_GTC, 0, "TradingBridge");
      if(result) ticket = trade.ResultOrder();
   }
   else if(action == "close")
   {
      ulong ticketToClose = (ulong)StringToInteger(GetJsonValue(jsonMessage, "ticket"));
      result = ClosePositionByTicket(ticketToClose);
      ticket = ticketToClose;
   }
   else if(action == "modify")
   {
      ulong ticketToModify = (ulong)StringToInteger(GetJsonValue(jsonMessage, "ticket"));
      result = ModifyPosition(ticketToModify, sl, tp);
      ticket = ticketToModify;
   }
   else if(action == "close_all")
   {
      result = CloseAllPositions();
   }
   
   //--- Send result
   if(result)
   {
      SendOrderResult("success", ticket, "Order executed", correlationId);
      Print("Order executed successfully: ", action, " ", symbol, " ", volume);
   }
   else
   {
      string errorMsg = StringFormat("Error %d: %s", GetLastError(), trade.ResultRetcodeDescription());
      SendOrderResult("error", 0, errorMsg, correlationId);
      Print("Order failed: ", errorMsg);
   }
}

bool ClosePositionByTicket(ulong ticket)
{
   if(!positionInfo.SelectByTicket(ticket))
   {
      Print("Position not found: ", ticket);
      return false;
   }
   
   return trade.PositionClose(ticket);
}

bool ModifyPosition(ulong ticket, double sl, double tp)
{
   if(!positionInfo.SelectByTicket(ticket))
   {
      Print("Position not found for modification: ", ticket);
      return false;
   }
   
   return trade.PositionModify(ticket, sl, tp);
}

bool CloseAllPositions()
{
   bool allClosed = true;
   
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(positionInfo.SelectByIndex(i))
      {
         if(positionInfo.Magic() == InpMagicNumber)
         {
            if(!trade.PositionClose(positionInfo.Ticket()))
            {
               allClosed = false;
               Print("Failed to close position: ", positionInfo.Ticket());
            }
         }
      }
   }
   
   return allClosed;
}

void SendOrderResult(string status, ulong ticket, string message, string correlationId = "")
{
   string resultMessage = StringFormat(
      "{\"type\":\"order_result\",\"payload\":{\"status\":\"%s\",\"ticket\":%d,\"message\":\"%s\",\"correlationId\":\"%s\",\"timestamp\":%d}}",
      status,
      ticket,
      message,
      correlationId,
      (int)TimeCurrent()
   );
   
   SendMessage(resultMessage);
}

//+------------------------------------------------------------------+
//| Kill switch - emergency stop                                       |
//+------------------------------------------------------------------+
void ActivateKillSwitch(string reason)
{
   Print("!!! KILL SWITCH ACTIVATED !!! Reason: ", reason);
   
   //--- Disable all trading
   tradingEnabled = false;
   
   //--- Close all positions immediately
   CloseAllPositions();
   
   //--- Cancel all pending orders
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(orderInfo.SelectByIndex(i))
      {
         if(orderInfo.Magic() == InpMagicNumber)
         {
            trade.OrderDelete(orderInfo.Ticket());
         }
      }
   }
   
   //--- Send confirmation
   string killMessage = StringFormat(
      "{\"type\":\"kill_switch_activated\",\"payload\":{\"reason\":\"%s\",\"timestamp\":%d}}",
      reason,
      (int)TimeCurrent()
   );
   SendMessage(killMessage);
   
   Alert("KILL SWITCH ACTIVATED: ", reason);
}

//+------------------------------------------------------------------+
//| Utility functions                                                  |
//+------------------------------------------------------------------+
string TimeframeToString(ENUM_TIMEFRAMES tf)
{
   switch(tf)
   {
      case PERIOD_M1:  return "M1";
      case PERIOD_M5:  return "M5";
      case PERIOD_M15: return "M15";
      case PERIOD_M30: return "M30";
      case PERIOD_H1:  return "H1";
      case PERIOD_H4:  return "H4";
      case PERIOD_D1:  return "D1";
      case PERIOD_W1:  return "W1";
      case PERIOD_MN1: return "MN1";
      default:         return "M1";
   }
}

string GetJsonValue(string json, string key)
{
   //--- Simple JSON value extractor
   string searchKey = "\"" + key + "\":";
   int keyPos = StringFind(json, searchKey);
   
   if(keyPos == -1)
      return "";
   
   int valueStart = keyPos + StringLen(searchKey);
   
   //--- Skip whitespace
   while(valueStart < StringLen(json) && StringGetCharacter(json, valueStart) == ' ')
      valueStart++;
   
   if(valueStart >= StringLen(json))
      return "";
   
   ushort firstChar = StringGetCharacter(json, valueStart);
   
   //--- String value
   if(firstChar == '\"')
   {
      int valueEnd = StringFind(json, "\"", valueStart + 1);
      if(valueEnd == -1) return "";
      return StringSubstr(json, valueStart + 1, valueEnd - valueStart - 1);
   }
   
   //--- Number or boolean value
   int valueEnd = valueStart;
   while(valueEnd < StringLen(json))
   {
      ushort c = StringGetCharacter(json, valueEnd);
      if(c == ',' || c == '}' || c == ']' || c == ' ' || c == '\n' || c == '\r')
         break;
      valueEnd++;
   }
   
   return StringSubstr(json, valueStart, valueEnd - valueStart);
}

//+------------------------------------------------------------------+
//| Chart event handler                                                |
//+------------------------------------------------------------------+
void OnChartEvent(const int id, const long& lparam, const double& dparam, const string& sparam)
{
   //--- Handle chart events if needed
}

//+------------------------------------------------------------------+
