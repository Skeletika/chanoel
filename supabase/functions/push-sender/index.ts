// Setup: https://supabase.com/docs/guides/functions/quickstart

import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import webpush from 'npm:web-push@3.6.7';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') as string;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') as string;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') as string;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

// Initialize WebPush
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
        webpush.setVapidDetails(
            'mailto:contact@notre-espace.app',
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        );
        console.log("✅ WebPush Configured");
    } catch (err) {
        console.error("❌ WebPush Config Error:", err);
    }
} else {
    console.error("❌ Missing VAPID Keys in Environment");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface WebhookPayload {
    table: string;
    record: {
        id: string;
        user_id?: string;
        couple_id?: string;
        content?: string;
        text?: string;
        title?: string;
        date?: string;
        time?: string;
        category?: string;
        [key: string]: any;
    };
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    schema: string;
}

serve(async (req: Request) => {
    try {
        const payload: WebhookPayload = await req.json();
        console.log("📩 Webhook Received:", JSON.stringify(payload));

        const { record, table } = payload;

        if (!record) {
            console.log("⚠️ Skipping: No record found");
            return new Response("Skipped", { status: 200 });
        }

        const senderId = record.user_id || record.sender_id || record.author_id || record.created_by;

        if (!senderId) {
            console.log("⚠️ Skipping: No sender ID found in record:", record);
            return new Response("Skipped", { status: 200 });
        }

        // 1. Identify Sender
        const { data: senderUser, error: senderError } = await supabase.auth.admin.getUserById(senderId);
        if (senderError) console.error("Error fetching sender:", senderError);
        const senderName = senderUser?.user?.user_metadata?.name || "Votre partenaire";
        console.log("👤 Sender:", senderName);

        // 2. Identify Couple ID
        let coupleId = record.couple_id;
        if (!coupleId) {
            // Fallback: Try to find couple via profile if not in record
            const { data: profile } = await supabase.from('profiles').select('couple_id').eq('id', senderId).single();
            coupleId = profile?.couple_id;
        }

        if (!coupleId) {
            console.error("❌ No couple_id found.");
            return new Response("No couple_id found", { status: 200 });
        }

        // 3. Find Recipient (Partner)
        // We want the profile in the SAME couple, but NOT the sender.
        const { data: partnerProfiles, error: partnerError } = await supabase
            .from('profiles')
            .select('id')
            .eq('couple_id', coupleId)
            .neq('id', senderId)
            .limit(1);

        if (partnerError) console.error("Error finding partner:", partnerError);

        if (!partnerProfiles || partnerProfiles.length === 0) {
            console.log("⚠️ No partner found in this couple (User is alone?)");
            return new Response("No partner found", { status: 200 });
        }

        const partnerId = partnerProfiles[0].id;
        console.log("🎯 Target Partner ID:", partnerId);

        // 4. Get Subscriptions
        const { data: subs, error: subError } = await supabase
            .from('push_subscriptions')
            .select('subscription')
            .eq('user_id', partnerId);

        if (subError) console.error("Error fetching subs:", subError);

        if (!subs || subs.length === 0) {
            console.log("📭 Partner has no push subscriptions.");
            return new Response("No subscriptions", { status: 200 });
        }

        // 5. Prepare Notification
        let title = "Notre Espace";
        let body = "Nouveau contenu !";
        let url = "/";

        if (table === 'messages') {
            title = `Nouveau message de ${senderName}`;
            body = record.content ? record.content.substring(0, 50) : "Message reçu";
            url = "/chat";
        } else if (table === 'notes') {
            title = `Nouvelle note de ${senderName}`;
            body = record.content ? record.content.substring(0, 50) : "Note ajoutée";
            url = "/dashboard";
        } else if (table === 'events') {
            title = `📅 ${record.title}`;
            body = `Le ${record.date}`;
            url = "/calendar";
        } else if (table === 'todos') {
            title = `✅ Tâche : ${record.text?.substring(0, 30)}`;
            body = `Catégorie : ${record.category}`;
            url = "/dashboard";
        } else if (table === 'timeline_events') {
            title = `🕰️ Nouveau souvenir !`;
            body = `${record.title}`;
            url = "/timeline";
        } else if (table === 'surprises') {
            title = `🎁 Surprise !`;
            body = `${record.title}`;
            url = "/surprises";
        }

        const notificationPayload = JSON.stringify({ title, body, url });
        console.log("📦 Payload:", notificationPayload);

        // 6. Send Pushes
        const promises = subs.map(async (subRow) => {
            try {
                const sub = typeof subRow.subscription === 'string'
                    ? JSON.parse(subRow.subscription)
                    : subRow.subscription;

                await webpush.sendNotification(sub, notificationPayload);
                console.log("✅ Push sent successfully.");
            } catch (err: any) {
                console.error("❌ Send Error:", err);
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Cleanup invalid
                    await supabase.from('push_subscriptions').delete().match({ subscription: subRow.subscription });
                    console.log("🗑️ Deleted invalid subscription.");
                }
            }
        });

        await Promise.all(promises);
        return new Response("Notifications processed", { status: 200 });

    } catch (error: any) {
        console.error("🔥 Fatal Error:", error);
        return new Response(error.message, { status: 500 });
    }
});
