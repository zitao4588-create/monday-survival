export interface TipNoteProps {
  children: string;
  label?: string;
}

export function TipNote({ children, label = "小贴士" }: TipNoteProps) {
  return (
    <aside className="ms-tip ms-paper">
      <span>{label}</span>
      <p>{children}</p>
    </aside>
  );
}
