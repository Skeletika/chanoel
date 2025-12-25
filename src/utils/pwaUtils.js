import { supabase } from '../lib/supabase';

export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', registration);
      return registration;
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  }
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const subscribeUserToPush = async () => {
    if (!('serviceWorker' in navigator)) return null;

    try {
        const registration = await navigator.serviceWorker.ready;
        
        // VAPID Public Key (Replace with yours later)
        // For now we subscribe without visibleKey just to get the endpoint (might vary by browser support)
        // NOTE: Chrome requires a VAPID key usually. 
        // We will use a placeholder or assume the user will generate one.
        // For this step, we just try basic subscription if possible, 
        // or just return the permission status if we can't generate a sub without a key.
        
        // Actually, without a VAPID key, pushManager.subscribe might fail or give a non-usable endpoint for your own server.
        // I will assume for now we just return true if permission granted, 
        // AND we attempt to get the subscription object if it exists.
        
        // Ideally: const sub = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: ... });
        // Let's Stub this part to save the "Intent" in DB at least? No, we need the endpoint.
        // I will add a TO-DO comment for the VAPID key.
        
        const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'BOB8cDNa7fPe3p7FklnC11Hq4IL9SrwlOn97ep6eDCKwNF7f0zrvdFG6Y-4ose4IMEq7hISnfl-HgJ5EsPe91C8'
        });

        // Save to DB
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({ 
                    user_id: user.id,
                    subscription: JSON.stringify(sub)
                }, { onConflict: 'user_id, subscription' });
            
            if (error) console.error('DB Save error:', error);
        }

        return sub;
    } catch (error) {
        console.error('Subscription failed:', error);
        return null;
    }
};
