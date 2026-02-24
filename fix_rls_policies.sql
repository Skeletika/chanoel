-- Ajout de la politique de LECTURE (indispensable pour que l'appli vérifie l'état)
CREATE POLICY "Users can select their own subscriptions"
ON public.push_subscriptions FOR SELECT
USING (auth.uid() = user_id);

-- Ajout de la politique de MISE À JOUR (utile pour l'upsert)
CREATE POLICY "Users can update their own subscriptions"
ON public.push_subscriptions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- On s'assure que tout est propre
GRANT ALL ON TABLE public.push_subscriptions TO service_role;
GRANT ALL ON TABLE public.push_subscriptions TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.push_subscriptions TO authenticated;

NOTIFY pgrst, 'reload';
