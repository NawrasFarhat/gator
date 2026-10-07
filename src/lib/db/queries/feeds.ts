import { db } from "../index.js";
import { feeds, users } from "../schema.js";
import { eq, sql } from "drizzle-orm";
export type Feed = typeof feeds.$inferSelect;
export type User = typeof users.$inferSelect;

export async function createFeed(name: string,url: string,userId: string,) {
const [result] = await db.insert(feeds).values({name,url,userId,}).returning();
return result;
}

export function printFeed(feed: Feed, user: User): void {
console.log("Feed:");
console.log("  ID:", feed.id);
console.log("  Name:", feed.name);
console.log("  URL:", feed.url);

console.log("User:");
console.log("  ID:", user.id);
console.log("  Name:", user.name);
}

export async function getFeeds() {
const results = await db.select({feed: feeds,user: users,}).from(feeds).innerJoin(users, eq(feeds.userId, users.id));
return results;
}

export async function getFeedByURL(url: string) {
  const [feed] = await db.select().from(feeds).where(eq(feeds.url, url));
  return feed;
}

export async function markFeedFetched(feedId: string) {
const now = new Date();

  await db.update(feeds)
    .set({
      lastFetchedAt: now,
      updatedAt: now,
    })
    .where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
  const [feed] = await db
    .select()
    .from(feeds)
    .orderBy(sql`${feeds.lastFetchedAt} ASC NULLS FIRST`)
    .limit(1);

  return feed;
}
