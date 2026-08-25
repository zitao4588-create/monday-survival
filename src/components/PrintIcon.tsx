export type PrintIconName = "download";

export interface PrintIconProps {
  name: PrintIconName;
}

export function PrintIcon({ name }: PrintIconProps) {
  return (
    <svg className="ms-icon" aria-hidden="true" data-icon-name={name} viewBox="0 0 48 48" focusable="false">
      <path d="M24 8v22" />
      <path d="m14 22 10 10 10-10" />
      <path d="M11 36h26" />
    </svg>
  );
}
