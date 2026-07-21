export function moveSelection(currentIndex: number, direction: -1 | 1, itemCount: number): number {
  if (itemCount <= 0) return 0;
  return Math.max(0, Math.min(itemCount - 1, currentIndex + direction));
}

type SelectionWindow<T> = {
  startIndex: number;
  items: T[];
};

export function getSelectionWindow<T>(
  items: T[],
  selectedIndex: number,
  visibleCount: number,
  itemsBeforeSelection = 4,
): SelectionWindow<T> {
  const maximumStart = Math.max(0, items.length - visibleCount);
  const startIndex = Math.max(0, Math.min(selectedIndex - itemsBeforeSelection, maximumStart));
  return {
    startIndex,
    items: items.slice(startIndex, startIndex + visibleCount),
  };
}
