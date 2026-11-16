import type { AlertState } from "./alert-rule"

export interface AlertTransition {
  id: string
  ruleId: string
  fromState: AlertState
  toState: AlertState
  value: number
  tsMs: number
}
