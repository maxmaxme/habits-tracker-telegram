import {State, UserId} from "./user";
import {Habit} from "./habit";

export type UserData = {
  userId: UserId;
  habits: Habit[];
  timezone: string;
  state: State;
}
