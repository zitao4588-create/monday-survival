import type { ResultViewModel } from "./visualTypes";

export interface EndingTitleProps {
  result: ResultViewModel;
}

export function EndingTitle({ result }: EndingTitleProps) {
  return (
    <>
      <p className="ms-kicker">本局结局</p>
      <h2>{result.title}</h2>
      <p>{result.description}</p>
    </>
  );
}
