import type { ReactNode } from "react";

export interface ResultFolderProps {
  children: ReactNode;
}

export function ResultFolder({ children }: ResultFolderProps) {
  return (
    <article className="ms-result-paper ms-paper ms-paper--light">
      <span className="ms-paper-tape ms-result-paper__tape" aria-hidden="true" />
      <span className="ms-result-paper__binder" aria-hidden="true" />
      <span className="ms-paperclip ms-result-paper__clip" aria-hidden="true" />
      <div className="ms-coffee-ring ms-result-paper__coffee" aria-hidden="true" />
      {children}
      <div className="ms-result-stamp" aria-hidden="true">
        生存测试完成
      </div>
    </article>
  );
}
