"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const setupInviteListener = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const channel = supabase
        .channel("room-invites")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "room_invites",
            filter: `to_user=eq.${user.id}`,
          },
          (payload) => {
            alert(
              `You have been invited to a room!\nRoom ID: ${payload.new.room_id}`
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupInviteListener();
  }, []);

  return <>{children}</>;
}
