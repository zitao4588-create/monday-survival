export const PRODUCT_EVENT_NAMES = [
  "game_open",
  "intro_view",
  "game_start",
  "round_view",
  "choice_selected",
  "feedback_continue",
  "result_view",
  "result_image_generated",
  "share_attempted",
  "share_completed",
  "restart"
] as const;

export type ProductEventName = typeof PRODUCT_EVENT_NAMES[number];
export type ProductEventProperties = Record<string, string | number | boolean>;
export type ProductEventHandler = (name: ProductEventName, properties?: ProductEventProperties) => void;

export function emitProductEvent(
  handler: ProductEventHandler | undefined,
  name: ProductEventName,
  properties?: ProductEventProperties
) {
  handler?.(name, properties);
}
