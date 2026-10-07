import {createUser,getUserByName,deleteAllUsers,getUsers,} from "./lib/db/queries/users.js";
import { readConfig,setUser } from "./config.js";
import { fetchFeed } from "./rss.js";
import { createFeed,printFeed,getFeedByURL } from "./lib/db/queries/feeds.js";
import { getFeeds } from "./lib/db/queries/feeds.js";
import { createFeedFollow,getFeedFollowsForUser,deleteFeedFollow } from "./lib/db/queries/feedFollows.js";
import type { User } from "./lib/db/schema.js";
import { scrapeFeeds } from "./aggregator.js";
import { getPostsForUser } from "./lib/db/queries/posts.js";

type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;
type UserCommandHandler = (cmdName: string,user: User,...args: string[]) => Promise<void>;
const middlewareLoggedIn = (
  handler: UserCommandHandler,
): CommandHandler => {
return async (cmdName: string, ...args: string[]): Promise<void> => {
const config = readConfig();

if (!config.currentUserName) {
  throw new Error("No current user");
}

const user = await getUserByName(config.currentUserName);

if (!user) {
  throw new Error(`User ${config.currentUserName} not found`);
}
await handler(cmdName, user, ...args);
};
};


type CommandsRegistry = Record<string, CommandHandler>;

async function handlerLogin(cmdName: string, ...args: string[])  {
  if (args.length === 0) {
    throw new Error("Error: username is required");
  }

  const username = args[0];
const user = await getUserByName(username);

if (!user) {
  throw new Error("User does not exist");
}

setUser(username);

  console.log(`User ${username} has been set`);
}

async function handlerRegister(
   cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
  throw new Error("Error: username is required");
}
const username = args[0];
const existingUser = await getUserByName(username);
if (existingUser) {
  throw new Error("User already exists");
}
const user = await createUser(username);
setUser(username);

console.log(`User ${username} has been registered`);
console.log(user);
}

async function handlerReset(
  cmdName: string,
  ...args: string[]
):Promise<void> {
await deleteAllUsers();
  console.log("Database reset successfully");
}

async function handlerUsers(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const users = await getUsers();
  const config = readConfig();

  for (const user of users) {
    if (user.name === config.currentUserName) {
      console.log(`* ${user.name} (current)`);
    } else {
      console.log(`* ${user.name}`);
    }
  }
}


async function handlerAgg(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length < 1) {
    throw new Error("Error: time between requests is required");
   }

  const timeBetweenRequests = parseDuration(args[0]);

  console.log(`Collecting feeds every ${args[0]}`);

  await scrapeFeeds();
   const interval = setInterval(() => {
    scrapeFeeds().catch(console.error);
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}


function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
): void {
  registry[cmdName] = handler;
}

async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
) {
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }

  await handler(cmdName, ...args);
}

async function handlerAddFeed(
  cmdName: string,
   user: User,
  ...args: string[]
): Promise<void> {
if (args.length < 1) {
  throw new Error("Error: feed name is required");
}
const name = args[0];

if (args.length < 2) {
  throw new Error("Error: feed URL is required");
}
const url = args[1];

const feed = await createFeed(name, url, user.id);
const feedFollow = await createFeedFollow(user.id, feed.id);
console.log(`* ${feedFollow.feedName}`);
console.log(`  User: ${feedFollow.userName}`);

}

async function handlerFeeds(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const feeds = await getFeeds();

  for (const item of feeds) {
    console.log(`* ${item.feed.name}`);
    console.log(`  URL: ${item.feed.url}`);
    console.log(`  User: ${item.user.name}`);
  }
}

async function handlerFollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {

  if (args.length < 1) {
    throw new Error("Error: feed URL is required");
  }

  const url = args[0];


  const feed = await getFeedByURL(url);

  if (!feed) {
    throw new Error("Feed not found");
  }

  const feedFollow = await createFeedFollow(user.id, feed.id);

  console.log(`* ${feedFollow.feedName}`);
  console.log(`  User: ${feedFollow.userName}`);

}


async function handlerFollowing(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {

  const follows = await getFeedFollowsForUser(user.id);

  for (const follow of follows) {
    console.log(`* ${follow.feedName}`);
  }
}


async function handlerUnfollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
 if (args.length < 1) {
    throw new Error("Error: feed URL is required");
  }

  const url = args[0];

  await deleteFeedFollow(user.id, url);
}

function parseDuration(durationStr: string): number {
const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error("Invalid duration");
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return amount;
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60_000;
    case "h":
      return amount * 3_600_000;
    default:
      throw new Error("Invalid duration unit");
  }
}

async function handlerBrowse(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  let limit = 2;

  if (args.length >= 1) {
    limit = Number(args[0]);
  }

  const posts = await getPostsForUser(user.id, limit);

  for (const post of posts) {
    console.log(`* ${post.post.title}`);
    console.log(`  URL: ${post.post.url}`);
    console.log(`  Published: ${post.post.publishedAt}`);
    console.log(`  Feed: ${post.feedName}`);
    console.log();
  }
}

async function main(): Promise<void> {
  const registry: CommandsRegistry = {};
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry,"browse",middlewareLoggedIn(handlerBrowse),);
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry,   "addfeed",middlewareLoggedIn(handlerAddFeed),);
  registerCommand(registry, "feeds", handlerFeeds);
  registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
  registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
  registerCommand(registry,"unfollow",middlewareLoggedIn(handlerUnfollow));

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Error: not enough arguments");
    process.exit(1);
  }

  const cmdName = args[0];
  const cmdArgs = args.slice(1);

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
  } catch (err) {
    console.error(err);
  process.exit(1);
}
process.exit(0);
}

main();

