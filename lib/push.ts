import webpush from 'web-push';
import { query } from './db';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:contact@marpeap.digital',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function sendPushNotif(referrerId: string, title: string, body: string): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const subs = await query(
    'SELECT endpoint, p256dh, auth_key FROM push_subscriptions WHERE referrer_id = $1',
    [referrerId]
  );

  const payload = JSON.stringify({ title, body });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        payload
      );
    } catch (err: any) {
      // Subscription expired → remove
      if (err.statusCode === 410 || err.statusCode === 404) {
        await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
      }
    }
  }
}

export async function sendPushToAll(title: string, body: string): Promise<void> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const subs = await query('SELECT endpoint, p256dh, auth_key FROM push_subscriptions');
  const payload = JSON.stringify({ title, body });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        payload
      );
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
      }
    }
  }
}
