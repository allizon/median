import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const MOVIES: { title: string; year: number; creator: string }[] = [
  // Action / Blockbuster
  { title: "Mad Max: Fury Road", year: 2015, creator: "George Miller" },
  { title: "Mission: Impossible – Rogue Nation", year: 2015, creator: "Christopher McQuarrie" },
  { title: "John Wick: Chapter 2", year: 2017, creator: "Chad Stahelski" },
  { title: "Mission: Impossible – Fallout", year: 2018, creator: "Christopher McQuarrie" },
  { title: "Top Gun: Maverick", year: 2022, creator: "Joseph Kosinski" },
  { title: "John Wick: Chapter 4", year: 2023, creator: "Chad Stahelski" },
  { title: "Fury", year: 2014, creator: "David Ayer" },
  { title: "Edge of Tomorrow", year: 2014, creator: "Doug Liman" },

  // Superhero
  { title: "Avengers: Infinity War", year: 2018, creator: "Anthony & Joe Russo" },
  { title: "Avengers: Endgame", year: 2019, creator: "Anthony & Joe Russo" },
  { title: "Black Panther", year: 2018, creator: "Ryan Coogler" },
  { title: "Spider-Man: Into the Spider-Verse", year: 2018, creator: "Bob Persichetti, Peter Ramsey, Rodney Rothman" },
  { title: "Spider-Man: No Way Home", year: 2021, creator: "Jon Watts" },
  { title: "Guardians of the Galaxy Vol. 2", year: 2017, creator: "James Gunn" },
  { title: "Thor: Ragnarok", year: 2017, creator: "Taika Waititi" },
  { title: "The Batman", year: 2022, creator: "Matt Reeves" },

  // Comedy
  { title: "The Grand Budapest Hotel", year: 2014, creator: "Wes Anderson" },
  { title: "Crazy Rich Asians", year: 2018, creator: "Jon M. Chu" },
  { title: "Game Night", year: 2018, creator: "John Francis Daley, Jonathan Goldstein" },
  { title: "Knives Out", year: 2019, creator: "Rian Johnson" },
  { title: "Glass Onion: A Knives Out Mystery", year: 2022, creator: "Rian Johnson" },
  { title: "The Nice Guys", year: 2016, creator: "Shane Black" },
  { title: "Superbad", year: 2007, creator: "Greg Mottola" },
  { title: "Barbie", year: 2023, creator: "Greta Gerwig" },

  // Award-winning Drama
  { title: "Spotlight", year: 2015, creator: "Tom McCarthy" },
  { title: "La La Land", year: 2016, creator: "Damien Chazelle" },
  { title: "Moonlight", year: 2016, creator: "Barry Jenkins" },
  { title: "The Shape of Water", year: 2017, creator: "Guillermo del Toro" },
  { title: "Green Book", year: 2018, creator: "Peter Farrelly" },
  { title: "Parasite", year: 2019, creator: "Bong Joon-ho" },
  { title: "Nomadland", year: 2020, creator: "Chloé Zhao" },
  { title: "CODA", year: 2021, creator: "Sian Heder" },
  { title: "Everything Everywhere All at Once", year: 2022, creator: "Daniel Kwan, Daniel Scheinert" },
  { title: "Oppenheimer", year: 2023, creator: "Christopher Nolan" },
  { title: "Poor Things", year: 2023, creator: "Yorgos Lanthimos" },

  // Sci-fi / Thriller crossover
  { title: "Interstellar", year: 2014, creator: "Christopher Nolan" },
  { title: "The Martian", year: 2015, creator: "Ridley Scott" },
  { title: "Arrival", year: 2016, creator: "Denis Villeneuve" },
  { title: "Dune", year: 2021, creator: "Denis Villeneuve" },
  { title: "Tenet", year: 2020, creator: "Christopher Nolan" },
];

async function main() {
  const firstUser = await prisma.user.findFirst({ select: { id: true } });
  if (!firstUser) {
    console.error("No users found — sign up first, then re-run the seed.");
    process.exit(1);
  }

  const createdById = firstUser.id;
  let created = 0;
  let skipped = 0;

  for (const movie of MOVIES) {
    const existing = await prisma.media.findFirst({
      where: { title: movie.title, type: "movie" },
      select: { id: true },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.media.create({
      data: {
        title: movie.title,
        year: movie.year,
        creator: movie.creator,
        type: "movie",
        createdById,
      },
    });
    created++;
  }

  console.log(`Done: ${created} created, ${skipped} already existed.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
