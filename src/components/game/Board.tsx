import Cell from "./Cell";

type CellValue = "X" | "O" | null;

interface BoardProps {
  cells: CellValue[];
  onCellClick: (index: number) => void;
  winningCells: number[];
  disabled: boolean;
}

const Board = ({ cells, onCellClick, winningCells, disabled }: BoardProps) => {
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px]">
      {cells.map((cell, index) => (
        <Cell
          key={index}
          value={cell}
          onClick={() => onCellClick(index)}
          isWinning={winningCells.includes(index)}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export default Board;
