ALTER TABLE public.push_subscriptions
ADD CONSTRAINT push_subscriptions_device_platform_unique UNIQUE (device_id, platform);