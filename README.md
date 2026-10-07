# Gator

Gator is a command-line RSS feed aggregator built with TypeScript, PostgreSQL, and Drizzle ORM.

It allows users to register and log in, add and follow RSS feeds, periodically fetch posts from those feeds, store posts in PostgreSQL, and browse the latest posts directly from the terminal.

## Requirements

Before running Gator, make sure you have Node.js, npm, PostgreSQL, and Git installed.

## Setup

Clone the repository:

git clone https://github.com/NawrasFarhat/gator.git
cd gator

Install the dependencies:

npm install

Make sure PostgreSQL is running and create a database named `gator`.

Create a configuration file at:

~/.gatorconfig.json

Add your PostgreSQL connection string:

{
  "db_url": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable"
}

Update the connection string if your PostgreSQL username, password, host, port, or database name is different.

Run the database migrations:

npx drizzle-kit migrate

## Usage

Run Gator using:

npm run start <command>

Register a new user:

npm run start register <username>

Example:

npm run start register kahya

Login:

npm run start login <username>

List users:

npm run start users

Add an RSS feed:

npm run start addfeed <name> <url>

Example:

npm run start addfeed "Hacker News RSS" "https://hnrss.org/newest"

List all feeds:

npm run start feeds

Follow a feed:

npm run start follow <feed-url>

Example:

npm run start follow "https://hnrss.org/newest"

View followed feeds:

npm run start following

Unfollow a feed:

npm run start unfollow <feed-url>

Browse the latest posts:

npm run start browse

The default limit is 2 posts. You can specify a different limit:

npm run start browse 10

Run the feed aggregator:

npm run start agg 1m

The aggregator supports milliseconds, seconds, minutes, and hours.

Examples:

npm run start agg 10s
npm run start agg 1m
npm run start agg 1h

The aggregator fetches RSS feeds periodically, stores new posts in the database, and continues running until you stop it with Ctrl+C.

## Features

- User registration and login
- RSS feed management
- Follow and unfollow feeds
- Periodic RSS feed aggregation
- PostgreSQL data persistence
- Duplicate post prevention
- Browse latest posts
- Configurable aggregation intervals
- Command-line interface

## Technologies

- TypeScript
- Node.js
- PostgreSQL
- Drizzle ORM
- Fast XML Parser
- RSS / XML
- npm