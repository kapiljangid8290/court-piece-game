"use client";

export default function InviteModal({
  invite,
  onAccept,
  onReject,
}: {
  invite: any;
  onAccept: () => void;
  onReject: () => void;
}) {
  if (!invite) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-black/90 text-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">

        <h2 className="text-xl font-bold text-yellow-400 mb-2">
          Game Invitation 🎮
        </h2>

        <p className="text-sm text-gray-300 mb-6">
          You have been invited to join a room.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onReject}
            className="flex-1 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 transition"
          >
            Reject
          </button>

          <button
            onClick={onAccept}
            className="flex-1 py-2 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
