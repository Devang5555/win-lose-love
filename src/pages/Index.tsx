import { motion } from "framer-motion";
import TicTacToe from "@/components/game/TicTacToe";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-background">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl sm:text-5xl md:text-6xl font-display font-bold mb-2 text-center"
      >
        Tic Tac Toe
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-muted-foreground text-lg mb-10"
      >
        Classic game, modern style
      </motion.p>

      <TicTacToe />

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 text-sm text-muted-foreground"
      >
        Click a cell to play
      </motion.footer>
    </div>
  );
};

export default Index;
