import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getPaymentEnvironment } from "@/lib/paddle";

export interface Subscription {
  id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  product_id: string;
  price_id: string;
  paddle_subscription_id: string;
  paddle_customer_id: string;
  environment: string;
}

export function useSubscription() {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const env = getPaymentEnvironment();

  const fetchSubscription = async () => {
    if (!session?.user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("environment", env)
      .maybeSingle();
    setSubscription(data as Subscription | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscription();

    if (!session?.user) return;

    const channel = supabase
      .channel(`subscriptions-${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${session.user.id}`,
        },
        () => fetchSubscription(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const isActive =
    !!subscription &&
    ["active", "trialing"].includes(subscription.status) &&
    (!subscription.current_period_end ||
      new Date(subscription.current_period_end) > new Date());

  return { subscription, loading, isActive, refetch: fetchSubscription };
}
