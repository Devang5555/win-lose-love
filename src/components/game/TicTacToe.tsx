import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Board from "./Board";
import GameStatus from "./GameStatus";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

type CellValue = "X" | "O" | null;
type Player = "X" | "O";

const WINNING_COMBINATIONS = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 3, 6], // left column
  [1, 4, 7], // middle column
  [2, 5, 8], // right column
  [0, 4, 8], // diagonal top-left to bottom-right
  [2, 4, 6], // diagonal top-right to bottom-left
];

const TicTacToe = () => {
  const [cells, setCells] = useState<CellValue[]>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningCells, setWinningCells] = useState<number[]>([]);

  const checkWinner = useCallback((newCells: CellValue[]): { winner: Player | null; cells: number[] } => {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (newCells[a] && newCells[a] === newCells[b] && newCells[a] === newCells[c]) {
        return { winner: newCells[a] as Player, cells: combination };
      }
    }
    return { winner: null, cells: [] };
  }, []);

  const isDraw = !winner && cells.every((cell) => cell !== null);

  const handleCellClick = (index: number) => {
    if (cells[index] || winner) return;

    const newCells = [...cells];
    newCells[index] = currentPlayer;
    setCells(newCells);

    const result = checkWinner(newCells);
    if (result.winner) {
      setWinner(result.winner);
      setWinningCells(result.cells);
    } else {
      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    }
  };

  const resetGame = () => {
    setCells(Array(9).fill(null));
    setCurrentPlayer("X");
    setWinner(null);
    setWinningCells([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-8"
    >
      <GameStatus winner={winner} isDraw={isDraw} currentPlayer={currentPlayer} />

      <Board
        cells={cells}
        onCellClick={handleCellClick}
        winningCells={winningCells}
        disabled={!!winner || isDraw}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={resetGame}
          variant="secondary"
          size="lg"
          className="font-display font-medium gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          New Game
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default TicTacToe;
