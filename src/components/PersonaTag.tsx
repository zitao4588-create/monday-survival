import type { ResultViewModel } from "./visualTypes";

export interface PersonaTagProps {
  result: ResultViewModel;
}

export function PersonaTag({ result }: PersonaTagProps) {
  return (
    <div className="ms-result-persona">
      <span className="ms-result-persona__icon" aria-hidden="true" />
      <span className="ms-result-persona__label">今日周一人格：</span>
      <strong>{result.personaLabel}</strong>
      <p>{result.personaQuote}</p>
    </div>
  );
}
