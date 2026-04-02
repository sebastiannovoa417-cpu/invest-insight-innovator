import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAlert, type Alert, type AlertCondition } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function useAlerts() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["alerts", user?.id],
        queryFn: async (): Promise<Alert[]> => {
            if (!user) return [];
            const { data, error } = await supabase
                .from("alerts")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return (data ?? []).map(mapDbAlert);
        },
        enabled: !!user,
    });

    const createMutation = useMutation({
        mutationFn: async ({
            ticker,
            condition,
            threshold,
        }: {
            ticker: string;
            condition: AlertCondition;
            threshold: number;
        }) => {
            if (!user) throw new Error("Not authenticated");
            const { error } = await supabase.from("alerts").insert({
                user_id: user.id,
                ticker,
                condition,
                threshold,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
            toast.success("Alert created");
        },
        onError: (err: Error) => toast.error("Failed to create alert: " + err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("alerts").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
            toast.success("Alert deleted");
        },
        onError: (err: Error) => toast.error("Failed to delete alert: " + err.message),
    });

    const resetMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from("alerts")
                .update({ status: "active", triggered_at: null })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
            toast.success("Alert reset to active");
        },
        onError: (err: Error) => toast.error("Failed to reset alert: " + err.message),
    });

    return {
        alerts: query.data ?? [],
        isLoading: query.isLoading,
        createAlert: createMutation.mutate,
        isCreating: createMutation.isPending,
        deleteAlert: deleteMutation.mutate,
        resetAlert: resetMutation.mutate,
    };
}

export type { Alert, AlertCondition };
