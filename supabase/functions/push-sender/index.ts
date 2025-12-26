// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/getting_started/setup_your_environment
// This function must be deployed to Supabase Edge Functions.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const Deno = globalThis.Deno || { env: { get: () => '' } };

console.log("Hello from push-sender!");

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5NkohOc'; // Replace or set in secrets
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:contact@notre-espace.app',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
    try {
        const payload = await req.json();
        console.log("Webhook received:", payload);

        // payload.record is the new row inserted
        const record = payload.record;
        const table = payload.table; // 'messages', 'notes', etc.

        if (!record || !record.user_id) {
            return new Response("No user_id in record", { status: 200 });
        }

        // 1. Find the Sender (to get their name) and the Couple
        // We assume 'messages' and 'notes' have 'user_id'
        const { data: senderUser } = await supabase.auth.admin.getUserById(record.user_id);
        const senderName = senderUser?.user?.user_metadata?.name || "Votre partenaire";

        // 2. Find the RECIPIENT (The other person in the couple)
        // We assume 'messages' and 'notes' have 'couple_id'.
        // Logic: Find the profile that has the same couple_id but different user_id.

        let coupleId = record.couple_id;
        if (!coupleId) {
            console.error("No couple_id in record");
            return new Response("No couple_id in record", { status: 200 });
        }

        // Find the partner profile
        const { data: partnerProfiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('couple_id', coupleId)
            .neq('id', record.user_id) // Exclude sender
            .limit(1);

        if (!partnerProfiles || partnerProfiles.length === 0) {
            console.log("No partner found for couple " + coupleId);
            return new Response("No partner found", { status: 200 });
        }

        const partnerId = partnerProfiles[0].id;


        console.log(`Sending push to partner: ${partnerId}`);

        // 3. Get Partner's Subscriptions
        const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('subscription')
            .eq('user_id', partnerId);

        if (!subs || subs.length === 0) {
            return new Response("No subscriptions for partner", { status: 200 });
        }

        // 4. Send the Push
        let title = "Notre Espace";
        let body = "Nouveau contenu disponible !";
        let url = "/";

        // Custom messages based on table
        if (table === 'messages') {
            title = `Nouveau message de ${senderName}`;
            body = record.content ? record.content.substring(0, 50) : "Vous avez reçu un message.";
            url = "/chat";
        } else if (table === 'notes') {
            title = `Nouvelle note de ${senderName}`;
            body = record.content ? record.content.substring(0, 50) : "Une note a été ajoutée.";
            url = "/dashboard";
        } else if (table === 'events') {
            title = `Nouvel événement : ${record.title}`;
            body = `Le ${record.date} à ${record.time || 'toute la journée'}`;
            url = "/calendar";
        } else if (table === 'todos') {
            title = `Nouvelle tâche : ${record.text.substring(0, 30)}`;
            body = `Catégorie : ${record.category || 'Général'}`;
            url = "/dashboard";
        } else if (table === 'timeline_events') {
            title = `Nouveau souvenir : ${record.title}`;
            body = `Ajouté à votre histoire du ${record.date}`;
            url = "/timeline";
        } else if (table === 'surprises') {
            title = `Une surprise vous attend ! 🎁`;
            body = `${record.title}`;
            url = "/surprises";
        }

        const notificationPayload = JSON.stringify({
            title,
            body,
            url
        });

        const sendPromises = subs.map(subRow => {
            const sub = subRow.subscription;
            // Check if subscription is valid JSON or object
            const subObj = (typeof sub === 'string') ? JSON.parse(sub) : sub;

            return webpush.sendNotification(subObj, notificationPayload)
                .catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        console.log('Subscription expired/invalid, deleting...');
                        return supabase.from('push_subscriptions').delete().match({ subscription: sub });
                    }
                    console.error("Error sending push:", err);
                });
        });

        await Promise.all(sendPromises);

        return new Response("Push sent!", { status: 200 });

    } catch (error) {
        console.error(error);
        return new Response(error.message, { status: 500 });
    }
});
