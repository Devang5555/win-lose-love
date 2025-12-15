import { motion } from "framer-motion";

type CellValue = "X" | "O" | null;

interface CellProps {
  value: CellValue;
  onClick: () => void;
  isWinning: boolean;
  disabled: boolean;
}

const Cell = ({ value, onClick, isWinning, disabled }: CellProps) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || value !== null}
      className={`
        aspect-square w-full rounded-lg bg-cell
        border-2 border-border
        flex items-center justify-center
        text-5xl sm:text-6xl md:text-7xl font-display font-bold
        transition-all duration-200
        ${!disabled && !value ? "hover:bg-cell-hover hover:scale-[1.02] cursor-pointer" : ""}
        ${isWinning ? "animate-pulse-glow border-game-win" : ""}
        ${disabled && !value ? "opacity-60" : ""}
      `}
      whileTap={!disabled && !value ? { scale: 0.95 } : {}}
    >
      {value && (
        <motion.span
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={value === "X" ? "text-game-x" : "text-game-o"}
        >
          {value}
        </motion.span>
      )}
    </motion.button>
  );
};

export default Cell;
