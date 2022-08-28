export type UserId = number;
export type State = 'none' | 'set_timezone' | 'add_habit'

export type User = {
  id: UserId,
  state: State,
  timezone: string | undefined,
}
