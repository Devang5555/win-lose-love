import { motion, AnimatePresence } from "framer-motion";

type Player = "X" | "O";

interface GameStatusProps {
  winner: Player | null;
  isDraw: boolean;
  currentPlayer: Player;
}

const GameStatus = ({ winner, isDraw, currentPlayer }: GameStatusProps) => {
  const getMessage = () => {
    if (winner) {
      return (
        <span className="flex items-center gap-2">
          <span className={winner === "X" ? "text-game-x" : "text-game-o"}>
            {winner}
          </span>
          <span>wins!</span>
        </span>
      );
    }
    if (isDraw) {
      return "It's a draw!";
    }
    return (
      <span className="flex items-center gap-2">
        <span className={currentPlayer === "X" ? "text-game-x" : "text-game-o"}>
          {currentPlayer}
        </span>
        <span className="text-muted-foreground">'s turn</span>
      </span>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={winner || isDraw.toString() || currentPlayer}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="text-2xl sm:text-3xl font-display font-semibold"
      >
        {getMessage()}
      </motion.div>
    </AnimatePresence>
  );
};

export default GameStatus;
