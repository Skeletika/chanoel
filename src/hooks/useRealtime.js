import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useCouple } from '../context/CoupleContext';

/**
 * Hook to subscribe to realtime changes in a Supabase table.
 * @param {string} table - The table name to listen to.
 * @param {function} callback - Function to call when a change occurs.
 * @param {string} [filter] - Optional filter string (default: couple_id=eq.{id}).
 */
export const useRealtime = (table, callback, filter = null) => {
    const { coupleData } = useCouple();
    const coupleId = coupleData?.couple?.id;
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!coupleId) return;

        const channel = supabase
            .channel(`public:${table}:${coupleId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: table,
                filter: filter || `couple_id=eq.${coupleId}`
            }, (payload) => {
                if (callbackRef.current) callbackRef.current(payload);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [coupleId, table, filter]);
};
