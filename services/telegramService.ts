
import type { Notification } from '../types';
import { getNotificationDetails } from './notificationService';

// Hardcoded Telegram Bot Token and Chat ID.
// IMPORTANT: In a real-world application, these should NEVER be stored in frontend code.
// They are here for demonstration purposes within this simulated environment.
const TELEGRAM_BOT_TOKEN = 'your-telegram-bot-token-here';
const TELEGRAM_CHAT_ID = 'your-telegram-chat-id-here';

const iconMap: Record<string, string> = {
    'fa-arrow-trend-up': '📈',
    'fa-arrow-trend-down': '📉',
    'fa-angles-up': '🔼',
    'fa-angles-down': '🔽',
    'fa-chart-line': '📊',
    'fa-level-up-alt': '⤴️',
    'fa-signal': '📶',
    'fa-magnet': '🧲',
    'fa-wave-square': '🌊',
    'fa-bolt': '⚡️',
    'fa-skull-crossbones': '☠️',
    'fa-box-archive': '📦',
    'fa-water': '💧',
    'fa-circle-check': '✅',
    'fa-check-double': '☑️',
    'fa-water-arrow-up': '⬆️💧',
    'fa-anchor-circle-up': '⚓️⬆️',
    'fa-anchor-circle-down': '⚓️⬇️',
    'fa-gem': '💎',
    'fa-arrow-down-to-bracket': '📥',
    'fa-arrow-up-to-bracket': '📤',
    'fa-arrow-up-from-bracket': '⏫',
    'fa-arrow-down-from-bracket': '⏬',
    'fa-rocket': '🚀',
    'fa-bolt-lightning': '⚡️',
    'fa-play-circle': '▶️',
    'fa-battery-quarter': '🔋',
    'fa-balance-scale-left': '⚖️',
    'fa-balance-scale-right': '⚖️',
    'fa-retweet': '🔄',
};


/**
 * Sends a formatted notification to the hardcoded Telegram chat via a bot.
 * @param notification The notification object containing alert details.
 */
export const sendTelegramMessage = async (
    notification: Omit<Notification, 'id' | 'read' | 'timestamp'>
): Promise<void> => {
    if (!TELEGRAM_BOT_TOKEN.includes(':') || !TELEGRAM_CHAT_ID) {
        console.warn('Telegram Bot Token or Chat ID is a placeholder. Skipping notification.');
        return;
    }
    
    const details = getNotificationDetails(notification as Notification);
    
    const icon = iconMap[details.icon] || '🔔';
    
    // Format a markdown-style message for Telegram
    const message = `*${icon} ${details.title}*\n${details.body}`;
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodeURIComponent(message)}&parse_mode=Markdown`;

    try {
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to send Telegram message:', errorData);
        }
    } catch (error) {
        console.error('Error sending Telegram message:', error);
    }
};
