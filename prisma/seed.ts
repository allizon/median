import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type SeedEntry = { title: string; year: number; creator: string; externalId: string; posterPath: string };

const TV_SHOWS: SeedEntry[] = [
  // Comedy
  { title: "Abbott Elementary", year: 2021, creator: "Quinta Brunson", externalId: "125935", posterPath: "/nBe1e3JJEZ6veGrVXNF0fRoLu56.jpg" },
  { title: "What We Do in the Shadows", year: 2019, creator: "Jemaine Clement", externalId: "83631", posterPath: "/wa3ZQE9kLnqwN3vQ0NNjg1NPsCa.jpg" },
  { title: "Schitt's Creek", year: 2015, creator: "Dan Levy, Eugene Levy", externalId: "61662", posterPath: "/iRfSzrPS5VYWQv7KVSEg2BZZL6C.jpg" },
  { title: "The Bear", year: 2022, creator: "Christopher Storer", externalId: "136315", posterPath: "/4fVddnbhcmzRZE14NJY03GKS6Fn.jpg" },
  { title: "Reservation Dogs", year: 2021, creator: "Sterlin Harjo, Taika Waititi", externalId: "95215", posterPath: "/t6hqwD5oQRGgNrZKN71BQYxteC1.jpg" },
  { title: "Only Murders in the Building", year: 2021, creator: "Steve Martin, John Hoffman", externalId: "107113", posterPath: "/1yjFVQZuW8aofZ5Cgol8iImsVFp.jpg" },
  { title: "Hacks", year: 2021, creator: "Lucia Aniello, Paul W. Downs, Jen Statsky", externalId: "124101", posterPath: "/ca5XiEFgyGsI38QT3wEKa1QVGX.jpg" },
  { title: "Ted Lasso", year: 2020, creator: "Jason Sudeikis, Bill Lawrence", externalId: "97546", posterPath: "/5fhZdwP1DVJ0FyVH6vrFdHwpXIn.jpg" },
  { title: "Barry", year: 2018, creator: "Alec Berg, Bill Hader", externalId: "73107", posterPath: "/j1XpwD11f0BAEI7pX6UdMhUVX2F.jpg" },
  { title: "Fleabag", year: 2016, creator: "Phoebe Waller-Bridge", externalId: "67070", posterPath: "/27vEYsRKa3eAniwmoccOoluEXQ1.jpg" },

  // Science Fiction
  { title: "Severance", year: 2022, creator: "Dan Erickson", externalId: "95396", posterPath: "/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg" },
  { title: "The Last of Us", year: 2023, creator: "Craig Mazin, Neil Druckmann", externalId: "100088", posterPath: "/dmo6TYuuJgaYinXBPjrgG9mB5od.jpg" },
  { title: "Andor", year: 2022, creator: "Tony Gilroy", externalId: "83867", posterPath: "/khZqmwHQicTYoS7Flreb9EddFZC.jpg" },
  { title: "Succession", year: 2018, creator: "Jesse Armstrong", externalId: "76331", posterPath: "/z0XiwdrCQ9yVIr4O0pxzaAYRxdW.jpg" },
  { title: "Dark", year: 2017, creator: "Baran bo Odar, Jantje Friese", externalId: "70523", posterPath: "/1DLjjvSWMYo17B7wuz6YikB96hH.jpg" },
  { title: "For All Mankind", year: 2019, creator: "Ronald D. Moore, Matt Wolpert, Ben Nedivi", externalId: "87917", posterPath: "/JP3DItWMbrrLiKR5AYUfpsNf2b.jpg" },
  { title: "Halt and Catch Fire", year: 2014, creator: "Christopher Cantwell, Christopher C. Rogers", externalId: "59659", posterPath: "/AtKo2gANo2QBgZN9ebTAa8hXnvv.jpg" },
  { title: "Devs", year: 2020, creator: "Alex Garland", externalId: "81349", posterPath: "/uv63iNWOh69bSJYJQZjiX6n8B3m.jpg" },
  { title: "Pantheon", year: 2022, creator: "Craig Silverstein", externalId: "195339", posterPath: "/aZupC6eJhTe82e5I0JRaOBjFHOd.jpg" },
  { title: "Silo", year: 2023, creator: "Graham Yost", externalId: "125988", posterPath: "/fDMTqUcEh6qJwWZP1SHTfoaqsCy.jpg" },
];

const MOVIES: SeedEntry[] = [
  // Action / Blockbuster
  { title: "Mad Max: Fury Road", year: 2015, creator: "George Miller", externalId: "76341", posterPath: "/hA2ple9q4qnwxp3hKVNhroipsir.jpg" },
  { title: "Mission: Impossible – Rogue Nation", year: 2015, creator: "Christopher McQuarrie", externalId: "177677", posterPath: "/fRJLXQBHK2wyznK5yZbO7vmsuVK.jpg" },
  { title: "John Wick: Chapter 2", year: 2017, creator: "Chad Stahelski", externalId: "324552", posterPath: "/hXWBc0ioZP3cN4zCu6SN3YHXZVO.jpg" },
  { title: "Mission: Impossible – Fallout", year: 2018, creator: "Christopher McQuarrie", externalId: "353081", posterPath: "/AkJQpZp9WoNdj7pLYSj1L0RcMMN.jpg" },
  { title: "Top Gun: Maverick", year: 2022, creator: "Joseph Kosinski", externalId: "361743", posterPath: "/n0YuM4f5lvGAP6MAW2kBIzugXnc.jpg" },
  { title: "John Wick: Chapter 4", year: 2023, creator: "Chad Stahelski", externalId: "603692", posterPath: "/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg" },
  { title: "Fury", year: 2014, creator: "David Ayer", externalId: "228150", posterPath: "/pfte7wdMobMF4CVHuOxyu6oqeeA.jpg" },
  { title: "Edge of Tomorrow", year: 2014, creator: "Doug Liman", externalId: "137113", posterPath: "/nBM9MMa2WCwvMG4IJ3eiGUdbPe6.jpg" },

  // Superhero
  { title: "Avengers: Infinity War", year: 2018, creator: "Anthony & Joe Russo", externalId: "299536", posterPath: "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg" },
  { title: "Avengers: Endgame", year: 2019, creator: "Anthony & Joe Russo", externalId: "299534", posterPath: "/ulzhLuWrPK07P1YkdWQLZnQh1JL.jpg" },
  { title: "Black Panther", year: 2018, creator: "Ryan Coogler", externalId: "284054", posterPath: "/uxzzxijgPIY7slzFvMotPv8wjKA.jpg" },
  { title: "Spider-Man: Into the Spider-Verse", year: 2018, creator: "Bob Persichetti, Peter Ramsey, Rodney Rothman", externalId: "324857", posterPath: "/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg" },
  { title: "Spider-Man: No Way Home", year: 2021, creator: "Jon Watts", externalId: "634649", posterPath: "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg" },
  { title: "Guardians of the Galaxy Vol. 2", year: 2017, creator: "James Gunn", externalId: "283995", posterPath: "/y4MBh0EjBlMuOzv9axM4qJlmhzz.jpg" },
  { title: "Thor: Ragnarok", year: 2017, creator: "Taika Waititi", externalId: "284053", posterPath: "/rzRwTcFvttcN1ZpX2xv4j3tSdJu.jpg" },
  { title: "The Batman", year: 2022, creator: "Matt Reeves", externalId: "414906", posterPath: "/74xTEgt7R36Fpooo50r9T25onhq.jpg" },

  // Comedy
  { title: "The Grand Budapest Hotel", year: 2014, creator: "Wes Anderson", externalId: "120467", posterPath: "/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg" },
  { title: "Crazy Rich Asians", year: 2018, creator: "Jon M. Chu", externalId: "455207", posterPath: "/1XxL4LJ5WHdrcYcihEZUCgNCpAW.jpg" },
  { title: "Game Night", year: 2018, creator: "John Francis Daley, Jonathan Goldstein", externalId: "445571", posterPath: "/85R8LMyn9f2Lev2YPBF8Nughrkv.jpg" },
  { title: "Knives Out", year: 2019, creator: "Rian Johnson", externalId: "546554", posterPath: "/pThyQovXQrw2m0s9x82twj48Jq4.jpg" },
  { title: "Glass Onion: A Knives Out Mystery", year: 2022, creator: "Rian Johnson", externalId: "661374", posterPath: "/vDGr1YdrlfbU9wxTOdpf3zChmv9.jpg" },
  { title: "The Nice Guys", year: 2016, creator: "Shane Black", externalId: "290250", posterPath: "/clq4So9spa9cXk3MZy2iMdqkxP2.jpg" },
  { title: "Superbad", year: 2007, creator: "Greg Mottola", externalId: "8363", posterPath: "/ek8e8txUyUwd2BNqj6lFEerJfbq.jpg" },
  { title: "Barbie", year: 2023, creator: "Greta Gerwig", externalId: "346698", posterPath: "/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg" },

  // Award-winning Drama
  { title: "Spotlight", year: 2015, creator: "Tom McCarthy", externalId: "314365", posterPath: "/8DPGG400FgaFWaqcv11n8mRd2NG.jpg" },
  { title: "La La Land", year: 2016, creator: "Damien Chazelle", externalId: "313369", posterPath: "/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg" },
  { title: "Moonlight", year: 2016, creator: "Barry Jenkins", externalId: "376867", posterPath: "/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg" },
  { title: "The Shape of Water", year: 2017, creator: "Guillermo del Toro", externalId: "399055", posterPath: "/9zfwPffUXpBrEP26yp0q1ckXDcj.jpg" },
  { title: "Green Book", year: 2018, creator: "Peter Farrelly", externalId: "490132", posterPath: "/7BsvSuDQuoqhWmU2fL7W2GOcZHU.jpg" },
  { title: "Parasite", year: 2019, creator: "Bong Joon-ho", externalId: "496243", posterPath: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" },
  { title: "Nomadland", year: 2020, creator: "Chloé Zhao", externalId: "581734", posterPath: "/dKT8rGDR55cM1vGn7QZLA9Tg9YC.jpg" },
  { title: "CODA", year: 2021, creator: "Sian Heder", externalId: "776503", posterPath: "/BzVjmm8l23rPsijLiNLUzuQtyd.jpg" },
  { title: "Everything Everywhere All at Once", year: 2022, creator: "Daniel Kwan, Daniel Scheinert", externalId: "545611", posterPath: "/u68AjlvlutfEIcpmbYpKcdi09ut.jpg" },
  { title: "Oppenheimer", year: 2023, creator: "Christopher Nolan", externalId: "872585", posterPath: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg" },
  { title: "Poor Things", year: 2023, creator: "Yorgos Lanthimos", externalId: "792307", posterPath: "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg" },

  // Sci-fi / Thriller crossover
  { title: "Interstellar", year: 2014, creator: "Christopher Nolan", externalId: "157336", posterPath: "/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg" },
  { title: "The Martian", year: 2015, creator: "Ridley Scott", externalId: "286217", posterPath: "/fASz8A0yFE3QB6LgGoOfwvFSseV.jpg" },
  { title: "Arrival", year: 2016, creator: "Denis Villeneuve", externalId: "329865", posterPath: "/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg" },
  { title: "Dune", year: 2021, creator: "Denis Villeneuve", externalId: "438631", posterPath: "/gDzOcq0pfeCeqMBwKIJlSmQpjkZ.jpg" },
  { title: "Tenet", year: 2020, creator: "Christopher Nolan", externalId: "577922", posterPath: "/aCIFMriQh8rvhxpN1IWGgvH0Tlg.jpg" },
];

async function main() {
  const firstUser = await prisma.user.findFirst({ select: { id: true } });
  if (!firstUser) {
    console.error("No users found — sign up first, then re-run the seed.");
    process.exit(1);
  }

  const createdById = firstUser.id;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const movie of MOVIES) {
    const existing = await prisma.media.findFirst({
      where: { title: movie.title, type: "movie" },
      select: { id: true, externalId: true, posterPath: true },
    });
    if (existing) {
      if (!existing.externalId || !existing.posterPath) {
        await prisma.media.update({
          where: { id: existing.id },
          data: { externalId: movie.externalId, posterPath: movie.posterPath },
        });
        updated++;
      } else {
        skipped++;
      }
      continue;
    }
    await prisma.media.create({
      data: {
        title: movie.title,
        year: movie.year,
        creator: movie.creator,
        type: "movie",
        externalId: movie.externalId,
        posterPath: movie.posterPath,
        createdById,
      },
    });
    created++;
  }

  for (const show of TV_SHOWS) {
    const existing = await prisma.media.findFirst({
      where: { title: show.title, type: "tv_show" },
      select: { id: true, externalId: true, posterPath: true },
    });
    if (existing) {
      if (!existing.externalId || !existing.posterPath) {
        await prisma.media.update({
          where: { id: existing.id },
          data: { externalId: show.externalId, posterPath: show.posterPath },
        });
        updated++;
      } else {
        skipped++;
      }
      continue;
    }
    await prisma.media.create({
      data: {
        title: show.title,
        year: show.year,
        creator: show.creator,
        type: "tv_show",
        externalId: show.externalId,
        posterPath: show.posterPath,
        createdById,
      },
    });
    created++;
  }

  console.log(`Done: ${created} created, ${updated} updated with TMDB ids, ${skipped} already up to date.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
