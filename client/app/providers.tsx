"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import InviteModal from "@/components/InviteModal";


export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [invite, setInvite] = useState<any>(null);

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
            setInvite(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupInviteListener();
  }, []);

  // ✅ ACCEPT INVITE
  const acceptInvite = async () => {
    if (!invite) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Add user to room
    await supabase.from("room_members").insert({
      room_id: invite.room_id,
      user_id: user.id,
    });

    // Update invite status
    await supabase
      .from("room_invites")
      .update({ status: "accepted" })
      .eq("id", invite.id);

    setInvite(null);
    router.push(`/room/${invite.room_id}`);
  };

  // ❌ REJECT INVITE
  const rejectInvite = async () => {
    if (!invite) return;

    await supabase
      .from("room_invites")
      .update({ status: "rejected" })
      .eq("id", invite.id);

    setInvite(null);
  };

  return (
    <>
      {children}

      {/* 🔔 INVITE MODAL */}
      <InviteModal
        invite={invite}
        onAccept={acceptInvite}
        onReject={rejectInvite}
      />
    </>
  );
}
