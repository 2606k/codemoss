let counter = 0;

export function generateKanbanId(): string {
  counter += 1;
  return `kb_${Date.now()}_${counter}`;
}
