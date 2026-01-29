type Card = {
  suit: string;
  value: string;
};

type Props = {
  card: Card;
  enabled?: boolean;
  onClick?: () => void;
};

const suitSymbol: Record<string, string> = {
  hearts: "♥",
  diamonds: "♦",
  spades: "♠",
  clubs: "♣",
};

export default function PlayingCard({
  card,
  enabled = true,
  onClick,
}: Props) {
  const isRed = card.suit === "hearts" || card.suit === "diamonds";
  const isFace = ["J", "Q", "K", "A"].includes(card.value);

  return (
    <div
      onClick={enabled ? onClick : undefined}
      className={`
        w-14 h-20 bg-white rounded-xl
        border border-black/10
        shadow-md
        overflow-hidden
        flex flex-col justify-between
        p-1.5
        transition-all duration-200
        ${enabled ? "cursor-pointer hover:-translate-y-2 hover:shadow-xl" : "opacity-40"}
      `}
      style={{ color: isRed ? "#c0392b" : "#111" }}
    >
      {/* Top */}
      <div className="text-xs font-bold leading-none">
        {card.value}
        <div className="text-xs">{suitSymbol[card.suit]}</div>
      </div>

      {/* Center */}
      <div className="flex-1 flex items-center justify-center">
        <span className={isFace ? "text-2xl font-extrabold" : "text-xl"}>
          {isFace ? card.value : suitSymbol[card.suit]}
        </span>
      </div>

      {/* Bottom (mirrored) */}
      <div className="text-xs font-bold leading-none rotate-180 self-end">
        {card.value}
        <div className="text-xs">{suitSymbol[card.suit]}</div>
      </div>
    </div>
  );
}
