import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
type NotificationType = "trade" | "alert" | "report" | "error";

interface NotificationSettings {
  telegram: { enabled: boolean; chatId: string; botToken: string };
  email: { enabled: boolean; address: string };
  webhook: { enabled: boolean; url: string };
}

interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

interface TradeNotification {
  action: 'opened' | 'closed' | 'modified';
  symbol: string;
  side: 'buy' | 'sell';
  volume: number;
  price: number;
  pnl?: number;
  pips?: number;
}

interface ReportData {
  period: 'daily' | 'weekly';
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  maxDrawdown: number;
}

// Telegram notification
async function sendTelegram(
  botToken: string,
  chatId: string,
  message: string
): Promise<boolean> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    
    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Telegram send error:', error);
    return false;
  }
}

// Webhook notification
async function sendWebhook(
  url: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Webhook send error:', error);
    return false;
  }
}

// Format trade notification
function formatTradeMessage(trade: TradeNotification): string {
  const emoji = trade.action === 'opened' 
    ? (trade.side === 'buy' ? '🟢' : '🔴')
    : trade.action === 'closed' 
      ? (trade.pnl && trade.pnl > 0 ? '💰' : '📉')
      : '✏️';
  
  let message = `${emoji} <b>Trade ${trade.action.toUpperCase()}</b>\n\n`;
  message += `Symbol: <code>${trade.symbol}</code>\n`;
  message += `Side: ${trade.side.toUpperCase()}\n`;
  message += `Volume: ${trade.volume} lots\n`;
  message += `Price: ${trade.price.toFixed(5)}\n`;
  
  if (trade.action === 'closed' && trade.pnl !== undefined) {
    const pnlEmoji = trade.pnl >= 0 ? '✅' : '❌';
    message += `\n${pnlEmoji} P/L: $${trade.pnl.toFixed(2)}`;
    if (trade.pips !== undefined) {
      message += ` (${trade.pips.toFixed(1)} pips)`;
    }
  }
  
  return message;
}

// Format report notification
function formatReportMessage(report: ReportData): string {
  const periodEmoji = report.period === 'daily' ? '📊' : '📈';
  const winRateEmoji = report.winRate >= 50 ? '🎯' : '📉';
  const pnlEmoji = report.totalPnL >= 0 ? '💰' : '💸';
  
  let message = `${periodEmoji} <b>${report.period.toUpperCase()} REPORT</b>\n\n`;
  message += `📋 Total Trades: ${report.totalTrades}\n`;
  message += `${winRateEmoji} Win Rate: ${report.winRate.toFixed(1)}%\n`;
  message += `${pnlEmoji} Total P/L: $${report.totalPnL.toFixed(2)}\n`;
  message += `📉 Max Drawdown: ${report.maxDrawdown.toFixed(2)}%\n`;
  
  return message;
}

// Format alert notification
function formatAlertMessage(title: string, message: string): string {
  return `⚠️ <b>${title}</b>\n\n${message}`;
}

// Format error notification
function formatErrorMessage(title: string, message: string): string {
  return `🚨 <b>ERROR: ${title}</b>\n\n${message}`;
}

// Main notification dispatcher
async function sendNotification(
  settings: NotificationSettings,
  payload: NotificationPayload
): Promise<{ success: boolean; results: Record<string, boolean> }> {
  const results: Record<string, boolean> = {};
  
  // Format message based on type
  let formattedMessage: string;
  
  switch (payload.type) {
    case 'trade':
      formattedMessage = formatTradeMessage(payload.data as unknown as TradeNotification);
      break;
    case 'report':
      formattedMessage = formatReportMessage(payload.data as unknown as ReportData);
      break;
    case 'alert':
      formattedMessage = formatAlertMessage(payload.title, payload.message);
      break;
    case 'error':
      formattedMessage = formatErrorMessage(payload.title, payload.message);
      break;
    default:
      formattedMessage = `<b>${payload.title}</b>\n\n${payload.message}`;
  }
  
  // Send to Telegram
  if (settings.telegram?.enabled && settings.telegram.botToken && settings.telegram.chatId) {
    results.telegram = await sendTelegram(
      settings.telegram.botToken,
      settings.telegram.chatId,
      formattedMessage
    );
  }
  
  // Send to Webhook
  if (settings.webhook?.enabled && settings.webhook.url) {
    results.webhook = await sendWebhook(settings.webhook.url, {
      ...payload,
      message: formattedMessage,
    });
  }
  
  // Email would require additional setup (e.g., Resend API)
  if (settings.email?.enabled && settings.email.address) {
    // For now, just log - would need RESEND_API_KEY
    console.log('Email notification requested for:', settings.email.address);
    results.email = false; // Not implemented without Resend API key
  }
  
  const success = Object.values(results).some(r => r === true);
  
  return { success, results };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, settings, payload, trade, report } = await req.json();
    
    console.log('Notifications service:', { action });
    
    switch (action) {
      case 'send': {
        const result = await sendNotification(settings, payload);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'tradeOpened':
      case 'tradeClosed': {
        const tradePayload: NotificationPayload = {
          type: 'trade',
          title: action === 'tradeOpened' ? 'Trade Opened' : 'Trade Closed',
          message: '',
          data: {
            action: action === 'tradeOpened' ? 'opened' : 'closed',
            ...trade,
          },
        };
        const result = await sendNotification(settings, tradePayload);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'dailySummary':
      case 'weeklyReport': {
        const reportPayload: NotificationPayload = {
          type: 'report',
          title: action === 'dailySummary' ? 'Daily Summary' : 'Weekly Report',
          message: '',
          data: {
            period: action === 'dailySummary' ? 'daily' : 'weekly',
            ...report,
          },
        };
        const result = await sendNotification(settings, reportPayload);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'alert': {
        const alertPayload: NotificationPayload = {
          type: 'alert',
          title: payload.title,
          message: payload.message,
        };
        const result = await sendNotification(settings, alertPayload);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      case 'test': {
        const testPayload: NotificationPayload = {
          type: 'alert',
          title: 'Test Notification',
          message: 'If you receive this, notifications are working correctly! 🎉',
        };
        const result = await sendNotification(settings, testPayload);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Notifications error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
