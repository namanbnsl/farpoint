export type TextEditingKey = {
  backspace: boolean;
  delete: boolean;
  ctrl: boolean;
  meta: boolean;
};

export function updateTextInput(
  currentValue: string,
  input: string,
  key: TextEditingKey,
): string | undefined {
  if (key.backspace || key.delete) return currentValue.slice(0, -1);
  if (key.ctrl || key.meta) return undefined;
  const typedCharacters = input.replace(/[\r\n]/g, "");
  return typedCharacters ? currentValue + typedCharacters : undefined;
}
