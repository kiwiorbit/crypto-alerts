
import type { Notification } from '../types';
import { getNotificationDetails } from './notificationService';

// Hardcoded Webhook URL
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/123456789012345678/your-webhook-token-here';

// Maps Tailwind CSS background color classes to decimal color codes for Discord embeds.
const colorMap: Record<string, number> = {
  'bg-red-500': 15158332,
  'bg-red-600': 15158332,
  'bg-green-500': 3066993,
  'bg-green-600': 3066993,
  'bg-sky-500': 3581519,
  'bg-purple-500': 10181046,
  'bg-cyan-500': 1420087,
  'bg-blue-500': 3447003,
  'bg-amber-500': 16753920,
  'bg-amber-600': 16753920,
  'bg-fuchsia-500': 14550272,
  'bg-yellow-500': 15844367,
  'bg-slate-500': 6724016,
  'bg-indigo-500': 6373356,
  'bg-teal-500': 1356708,
  'bg-orange-500': 16753920,
  'bg-orange-600': 16753920,
  'bg-cyan-400': 2523880,
  'bg-sky-400': 5981938,
  'bg-rose-500': 15883392,
  'bg-gray-500': 10070709,
};

/**
 * Sends a formatted notification to the hardcoded Discord webhook URL.
 * @param notification The notification object containing alert details.
 */
export const sendDiscordWebhook = async (
    notification: Omit<Notification, 'id' | 'read' | 'timestamp'>
): Promise<void> => {
    // Enrich the notification with display details (title, body, color, etc.)
    const details = getNotificationDetails(notification as Notification);
    
    const embed = {
        title: details.title,
        description: details.body,
        color: colorMap[details.accentColor] || 10070709, // Default to gray if color not found
        timestamp: new Date().toISOString(),
        footer: {
            text: 'Crypto RSI Scanner',
        },
    };

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                embeds: [embed],
            }),
        });
    } catch (error) {
        console.error('Failed to send Discord webhook:', error);
    }
};
