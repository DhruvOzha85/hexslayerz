import type { RuntimeMessageType } from "./RuntimeMessages";

export interface RuntimeRequest<T = unknown> {
  type: RuntimeMessageType;
  payload?: T;
}

export interface RuntimeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
