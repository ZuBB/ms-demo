import { useState, useRef, useEffect } from 'react'

export type Cell = {
  meta: number,
  content: string,
  isOpened: boolean
}

const getRowIndexFromCellIndex = (cellIndex: number) => Math.floor(Math.abs(cellIndex) / 9)

const isIndexInNeighbourRange = (index: number, baseIndex: number): boolean => {
  if (index < 0 || index > 80) return false
  if (baseIndex === -1) return true

  return getRowIndexFromCellIndex(baseIndex) === getRowIndexFromCellIndex(index)
};

const setNeighbourCellContent = (
  field: Cell[], index: number, baseIndex = -1,
): void => {
  if (!isIndexInNeighbourRange(index, baseIndex) || field[index].meta < 0) return

  field[index].meta++;
  field[index].content = field[index].meta.toString();
}

const genNewField = () => {
  const field: Cell[] = []

  for (let ii = 0; ii < 81; ii++) {
    field.push({ isOpened: false, content: '', meta: 0 })
  }

  const indexes = new Set<number>()
  while (indexes.size < 10) {
    const index = Math.round(Math.random() * 80)
    if (indexes.has(index)) continue;
    field[index].meta = -1
    indexes.add(index)
  }

  indexes.forEach(index => {
    setNeighbourCellContent(field, index - 9 - 1, index - 9);
    setNeighbourCellContent(field, index - 9);
    setNeighbourCellContent(field, index - 9 + 1, index - 9);
    setNeighbourCellContent(field, index - 1, index);
    setNeighbourCellContent(field, index + 1, index);
    setNeighbourCellContent(field, index + 9 - 1, index + 9);
    setNeighbourCellContent(field, index + 9);
    setNeighbourCellContent(field, index + 9 + 1, index + 9);
  })

  return field
}

function App() {
  const [field, setField] = useState<Cell[]>([])
  const [bombsLeft, setBombsLeft] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [isGamePlayed, setIsGamePlayed] = useState(false)
  const intervalId = useRef<number>();

  const newGameHander = () => {
    setField(genNewField())
    setBombsLeft(10)
    setSecondsLeft(100)
    setIsGamePlayed(true)
    intervalId.current = setInterval(() => {
      if (isGamePlayed && secondsLeft === 0) {
        clearInterval(intervalId.current);
      }
      setSecondsLeft(secondsLeft => secondsLeft - 1);
    }, 1000)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fieldClickHandler = (event: any) => {
    if (!isGamePlayed) return

    const { target } = event
    const index = parseInt(target.getAttribute('data-index'), 10)
    const cell = field[index]

    if (!event.shiftKey) {
      if (!cell || cell.isOpened) return

      // left button
      if (cell.meta === -1) {
        terminateGame(index)
      } else {
        openCell(index)
      }
    } else {
      // right button
      toggleBombCell(index)
    }
  }

  const terminateGame = (index: number) => {
    clearInterval(intervalId.current)
    setIsGamePlayed(false)
    setSecondsLeft(0)

    const newField = [...field]
    newField[index].isOpened = true
    newField[index].content = '💣'
    setField(newField)
  }

  const markCellAsOpened = (field: Cell[], index: number) => {
    field[index].isOpened = true;
    field[index].content = String(field[index].meta || '')
  }

  const openCell = (index: number) => {
    const newField = [...field]

    markCellAsOpened(newField, index)

    if (newField[index].meta === 0) {
      openNeighbourOpenCells(newField, index)
    }

    setField(newField)
  }

  const markCellAsOpenedIfEligible = (field: Cell[], index: number, baseIndex = -1) => {
    if (!isIndexInNeighbourRange(index, baseIndex)) return
    if (field[index].isOpened || field[index].meta < 0) return

    markCellAsOpened(field, index)

    if (!field[index].meta) {
      openNeighbourOpenCells(field, index)
    }
  }

  const openNeighbourOpenCells = (field: Cell[], index: number) => {
    markCellAsOpenedIfEligible(field, index - 9)
    markCellAsOpenedIfEligible(field, index - 1, index)
    markCellAsOpenedIfEligible(field, index + 1, index)
    markCellAsOpenedIfEligible(field, index + 9)
  }

  const toggleBombCell = (index: number) => {
    if (bombsLeft === 0) return

    const newField = [...field]
    newField[index].isOpened = !newField[index].isOpened
    newField[index].content = newField[index].isOpened ? '🚩' : ''
    const newBombsLeft = bombsLeft + (newField[index].isOpened ? -1 : 1)
    setBombsLeft(newBombsLeft)
    setField(newField)

    if (!newBombsLeft) {
      checkForWictory()
    }
  }

  const checkForWictory = () => {
    const validBombs = field.filter(cell => cell.meta < 0 && cell.content === '🚩').length

    if (validBombs === 10) {
      console.log('Its a victory!')
    }
  }

  useEffect(() => {
    return () => clearInterval(intervalId.current);
  }, [])

  return (
    <>
      <div className="flex flex-row gap-2 mb-2">
        <div className="border">{bombsLeft}</div>
        <button onClick={newGameHander}>
          new game
        </button>
        <div className="border">{secondsLeft}</div>
      </div>
      <div
        className="grid grid-rows-[repeat(9,30px)] grid-cols-[repeat(9,30px)] w-fit"
        onClick={fieldClickHandler}
      >
        {field.map((cell, index) => (
          <div
            key={index}
            className={`size-6 border text-center ${cell.isOpened ? 'border-neutral-400 bg-slate-200' : ''}`}
            data-meta={cell.meta}
            data-index={index}
          >
            {cell.isOpened ? cell.content : ''}
            {/* {cell.meta} */}
          </div>
        ))}
      </div>
    </>
  )
}

export default App
