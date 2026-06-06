import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const TV_SHOWS: { title: string; year: number; creator: string }[] = [
  // Comedy
  { title: "Abbott Elementary", year: 2021, creator: "Quinta Brunson" },
  { title: "What We Do in the Shadows", year: 2019, creator: "Jemaine Clement" },
  { title: "Schitt's Creek", year: 2015, creator: "Dan Levy, Eugene Levy" },
  { title: "The Bear", year: 2022, creator: "Christopher Storer" },
  { title: "Reservation Dogs", year: 2021, creator: "Sterlin Harjo, Taika Waititi" },
  { title: "Only Murders in the Building", year: 2021, creator: "Steve Martin, John Hoffman" },
  { title: "Hacks", year: 2021, creator: "Lucia Aniello, Paul W. Downs, Jen Statsky" },
  { title: "Ted Lasso", year: 2020, creator: "Jason Sudeikis, Bill Lawrence" },
  { title: "Barry", year: 2018, creator: "Alec Berg, Bill Hader" },
  { title: "Fleabag", year: 2016, creator: "Phoebe Waller-Bridge" },

  // Science Fiction
  { title: "Severance", year: 2022, creator: "Dan Erickson" },
  { title: "The Last of Us", year: 2023, creator: "Craig Mazin, Neil Druckmann" },
  { title: "Andor", year: 2022, creator: "Tony Gilroy" },
  { title: "Succession", year: 2018, creator: "Jesse Armstrong" },
  { title: "Dark", year: 2017, creator: "Baran bo Odar, Jantje Friese" },
  { title: "For All Mankind", year: 2019, creator: "Ronald D. Moore, Matt Wolpert, Ben Nedivi" },
  { title: "Halt and Catch Fire", year: 2014, creator: "Christopher Cantwell, Christopher C. Rogers" },
  { title: "Devs", year: 2020, creator: "Alex Garland" },
  { title: "Pantheon", year: 2022, creator: "Craig Silverstein" },
  { title: "Silo", year: 2023, creator: "Graham Yost" },
];

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
    if (existing) { skipped++; continue; }
    await prisma.media.create({
      data: { title: movie.title, year: movie.year, creator: movie.creator, type: "movie", createdById },
    });
    created++;
  }

  for (const show of TV_SHOWS) {
    const existing = await prisma.media.findFirst({
      where: { title: show.title, type: "tv_show" },
      select: { id: true },
    });
    if (existing) { skipped++; continue; }
    await prisma.media.create({
      data: { title: show.title, year: show.year, creator: show.creator, type: "tv_show", createdById },
    });
    created++;
  }

  console.log(`Done: ${created} created, ${skipped} already existed.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
