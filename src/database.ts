import {Habit} from "./types/habit";
import path from "path";
import * as fs from "fs";
import {UserData} from "./types/database";
import {State, User, UserId} from "./types/user";

const getUserData = async (userId: UserId): Promise<UserData> => {
  const filename = `${userId}.json`;
  const filepath = path.join(__dirname, '..', 'database', filename);

  if (!fs.existsSync(filepath)) {
    const state: State = 'none';
    const user = {
      userId,
      state,
      timezone: '',
      habits: [],
    };
    await fs.promises.writeFile(filepath, JSON.stringify(user));
    return user;
  } else {
    const json = await fs.promises.readFile(filepath, 'utf8');

    return JSON.parse(json)
  }
}

const setUserData = async (userId: UserId, userData: UserData): Promise<void> => {
  const filename = `${userId}.json`;
  const filepath = path.join(__dirname, '..', 'database', filename);

  await fs.promises.writeFile(filepath, JSON.stringify(userData));
}

export const getHabits = async (userId: UserId): Promise<Habit[]> => {
  return getUserData(userId).then((userData: UserData) => userData.habits);
}

export const getUser = async (userId: UserId): Promise<User> => {
  return getUserData(userId).then((userData: UserData) => ({
    id: userData.userId,
    state: userData.state,
    timezone: userData.timezone.length > 0 ? userData.timezone : undefined,
  }));
}

export const setUserState = async (userId: UserId, state: State): Promise<void> => {
  await setUserData(userId, await getUserData(userId).then((userData: UserData) => ({
    ...userData,
    state: state,
  })));
}

export const setUserTimezone = async (userId: UserId, timezone: string): Promise<void> => {
  await setUserData(userId, await getUserData(userId).then((userData: UserData) => ({
    ...userData,
    timezone: timezone,
  })));
}

export const resetUser = async (userId: UserId): Promise<void> => {
  const filename = `${userId}.json`;
  const filepath = path.join(__dirname, '..', 'database', filename);
  if (fs.existsSync(filepath)) {
    await fs.promises.rm(filepath);
  }
}
