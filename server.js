// Import all necessary libraries
import "dotenv/config";
import express, { response } from "express";
import cors                  from "cors";
import Database              from 'better-sqlite3';


//------------------------------------------------------------------------------//
//                  CREATE THE DATABASE IF IT DOES NOT EXIST                    //
//------------------------------------------------------------------------------//

// Create a connection to the database
const db = new Database(process.env.DATABASE_LOCATION);
db.pragma('journal_mode = WAL');

// Create the Movie List table
db.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    overview TEXT,
    release_date TEXT,
    poster_path TEXT,
    watched INTEGER,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )  
`);
// Create the Series List table
db.exec(`
  CREATE TABLE IF NOT EXISTS series (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    overview TEXT,
    first_air_date TEXT,
    poster_path TEXT,
    watched INTEGER,
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )  
`);

// Create the Anime List table
db.exec(`
    CREATE TABLE IF NOT EXISTS anime (
      id INTEGER PRIMARY KEY NOT NULL,
      idMal INTEGER NOT NULL,
      title_english TEXT NOT NULL,
      title_native TEXT,
      title_romaji TEXT,
      overview TEXT,
      first_air_date TEXT,
      poster_path TEXT,
      watched INTEGER,
      creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

//------------------------------------------------------------------------------//
//                          SETUP DB QUERIES                                    //
//------------------------------------------------------------------------------//
//------------------------------------------------------------------------------//
//                              MOVIES
//------------------------------------------------------------------------------//
const insertMovie         = db.prepare('INSERT INTO movies (id, title, overview, release_date, poster_path, watched) VALUES (?,?,?,?,?,?)');
const updateMovieWatched  = db.prepare('UPDATE movies SET watched = ? WHERE id = ?');
const selectMovieWatched  = db.prepare('SELECT watched FROM movies WHERE id = ?');
const deleteMovie         = db.prepare('DELETE from movies WHERE id = ?');
const movieExists         = db.prepare('SELECT id FROM movies WHERE id = ?');
//------------------------------------------------------------------------------//
// SERIES
//------------------------------------------------------------------------------//
const insertSeries        = db.prepare('INSERT INTO series (id, name, overview, first_air_date, poster_path, watched) VALUES (?,?,?,?,?,?)');
const updateSeriesWatched = db.prepare('UPDATE series SET watched = ? WHERE id = ?');
const selectSeriesWatched = db.prepare('SELECT watched FROM series WHERE id = ?');
const deleteSeries        = db.prepare('DELETE from series WHERE id = ?');
const seriesExists        = db.prepare('SELECT id FROM series WHERE id = ?');
//------------------------------------------------------------------------------//
// ANIME
//------------------------------------------------------------------------------//
const insertAnime         = db.prepare('INSERT INTO anime (id, idMal, title_english, title_native, title_romaji, overview, first_air_date, poster_path, watched) VALUES (?,?,?,?,?,?,?,?,?)');
const updateAnimeWatched  = db.prepare('UPDATE anime SET watched = ? WHERE id = ?');
const selectAnimeWatched  = db.prepare('SELECT watched FROM anime WHERE id = ?')
const deleteAnime         = db.prepare('DELETE FROM anime WHERE id = ?');
const animeExists         = db.prepare('SELECT id FROM anime WHERE id = ?');





//------------------------------------------------------------------------------//
//                           ENDPOINT LIST                                      //
//------------------------------------------------------------------------------//
//
// MOVIES
// ------------------
// "/search/movie"  : Search TMDB for a movie
// "/list/movie"    : Return complete Movie watch list from local DB
// "/insert/movie"  : Insert movie to local DB
// "/watched/movie" : Toggle movie watched/unwatched in local DB
// "/remove/movie"  : Delete movie from local DB
// "/exists/movie"  : Checks if a movie id exists in the local DB
// "/latest/movies" : Fetch Latest Movies from local DB
//
// SERIES
//-------------------
// "/search/series"  : Search TMDB for a series
// "/list/series"    : Return complete Series watch list from local DB
// "/insert/series"  : Insert series to local DB
// "/watched/series" : Toggle series watched/unwatched in local DB
// "/remove/series"  : Delete series from local DB
// "/exists/series"  : Checks if a series id exists in the local DB
// "/latest/series"  : Fetch Latest Series from local DB
//
// ANIME
//-------------------
// "/search/anime"  : Search AniList for a movie
// "/list/anime"    : Return complete Anime watch list from local DB
// "/insert/anime"  : Insert anime to local DB
// "/watched/anime" : Toggle anime watched/unwatched in local DB
// "/remove/anime"  : Delete anime from local DB
// "/exists/anime"  : Checks if an anime id exists in the local DB
// "/latest/anime"  : Fetch Latest Anime from local DB


//------------------------------------------------------------------------------//
//                  SETUP APP & ENDOINTS                                        //
//------------------------------------------------------------------------------//
const app = express();

app.use(cors());                  //Needs to change to be more secure
app.use(express.json());  
app.use(express.static("public"));

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${process.env.TOKEN}`,
  }
};

// Setup root endpoint
app.get("/", async(request, response,)=>{
  response.send(`Server running on port ${process.env.PORT}`);
});

// Search for movies
app.get("/search/movie", async(request, response,)=>{
  try {
    // Setup Search endpoint
    var search_url = new URL(process.env.SEARCH_MOVIES);
    search_url.searchParams.append("query", request.query.query);
    search_url.searchParams.append("include_adult", "false");

    const res = await fetch(search_url.href, options);
    const data = await res.json();
     
    const movies = data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      release_date: movie.release_date,
      poster_path: movie.poster_path,
    }));

    //response.json(data); //sends the response to the browser
    response.json(movies);

  } catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Failed to fetch movies' });
  }
});

//Search for Series
app.get("/search/series", async(request, response,)=>{
  
  try {
    // Setup Search endpoint
    var search_url = new URL(process.env.SEARCH_SERIES);
    search_url.searchParams.append("query", request.query.query);
    search_url.searchParams.append("include_adult", "false");

    const res = await fetch(search_url.href, options);
    const data = await res.json();
     
    let series = data.results.map(serie => ({
      genre_ids: serie.genre_ids,
      id: serie.id,
      original_language: serie.original_language,
      name: serie.name,
      overview: serie.overview,
      first_air_date: serie.first_air_date,
      poster_path: serie.poster_path,
    }));
    
  // TMDB has anime mixed in with TV results. We want to filter those out
  // since anime will be handled from a different API. 
  // We will be searching for "animation" id (16) in combination with 
  // "original_language" = "ja". This will be 90% accurate
    series = series.filter(item =>{
      return !(
        item.original_language === "ja" &&
        item.genre_ids.includes(16)
      );
    });

    //response.json(data); //sends the response to the browser
    response.json(series);

  } catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Failed to fetch series' });
  }
});

// Search for anime
app.get("/search/anime", async(request, response,)=>{

  const searchTerm = request.query.query;

  try{
    //construct GraphGL query
    const query = `
          query ($search: String!) {
              Page(page: 1, perPage:10) {
                  media(search: $search, type: ANIME) {
                      id
                      idMal
                      title {
                          romaji
                          english
                          native
                      }
                      coverImage {
                       large
                   }
                      description (asHtml: false)
                      startDate {
                          year
                          month
                          day
                      }
                  }
              }
          }
      `;

    const variables = {
        search: searchTerm
    };

    const aniResponse = await fetch(process.env.SEARCH_ANIME, {
        method: "POST",
        headers:  {
            "Content-Type": "application/json",
            "Accept": "application/json"  
        },
        body: JSON.stringify({
            query,
            variables
        })  
    });

    const data = await aniResponse.json();

    //Map Results to return structure
    const animeResults = data.data.Page.media.map(anime =>({
      id: anime.id,
      idMal: anime.idMal,
      title_english: anime.title.english ?? anime.title.romaji,
      title_native: anime.title.native,
      title_romaji: anime.title.romaji,
      poster_path: anime.coverImage.large,
      overview: anime.description.replace(/<br\s*\/?>/gi, "\n"),
      first_air_date: formatAniListDate(anime.startDate),
    }));

    response.json(animeResults);

} catch (err) {
    console.error(err);
    response.status(500).json({ error: 'Failed to fetch anime'});
} 

});

function formatAniListDate({year, month, day}) {
  //Anilist returns date as { year: 2009, month: 8, day: 6 } so we need to convert it 
  //to 2009-08-06
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

//Setup Insert to Movie List endpoint
app.post("/insert/movie", async(request, response,)=>{
  try {
    
    const newMovie = insertMovie.run(request.body.id,
                                     request.body.title,
                                     request.body.overview,
                                     request.body.release_date,
                                     request.body.poster_path,
                                     0
    );
    
    response.status(200).json({success: 'Added to watchlist'});

  } catch (err) {
    console.error(err);
    response.status(500).json({error: 'Failed to Insert to watchlist'});
  }
});

//Setup Insert to Series List endpoint
app.post("/insert/series", async(request, response,)=>{
  try {
    
    const newSeries = insertSeries.run(request.body.id,
                                       request.body.name,
                                       request.body.overview,
                                       request.body.first_air_date,
                                       request.body.poster_path,
                                       0
    );
    
    response.status(200).json({success: 'Added to watchlist'});

  } catch (err) {
    console.error(err);
    response.status(500).json({error: 'Failed to Insert to watchlist'});
  }
});

//Setup Insert to Series List endpoint
app.post("/insert/anime", async(request, response,)=>{

  try {
    
    const newAnime = insertAnime.run(request.body.id,
                                     request.body.idMal,
                                     request.body.title_english,
                                     request.body.title_native,
                                     request.body.title_romaji,
                                     request.body.overview,
                                     request.body.first_air_date,
                                     request.body.poster_path,
                                     0
    );
    
    response.status(200).json({success: 'Added to watchlist'});

  } catch (err) {
    console.error(err);
    response.status(500).json({error: 'Failed to Insert to watchlist'});
  }
});

app.get("/list/movie", async(request, response,)=>{
  
  const completeWatchList = db.prepare('SELECT * FROM movies').all();  
  response.json(completeWatchList);

});

app.get("/latest/movies", async(request, response,)=>{

  const latestMovies = db.prepare('SELECT * FROM movies WHERE watched = 0 ORDER BY creation_date DESC LIMIT 10').all();
  response.json(latestMovies);

});

app.get("/list/series", async(request, response,)=>{
  
  const completeWatchList = db.prepare('SELECT * FROM series').all();  
  response.json(completeWatchList);

});

app.get("/latest/series", async(request, response,)=>{

  const latestSeries = db.prepare('SELECT * FROM series WHERE watched = 0 ORDER BY creation_date DESC LIMIT 10').all();
  response.json(latestSeries);

});

app.get("/list/anime", async(request, response,)=>{
  
  const completeWatchList = db.prepare('SELECT * FROM anime').all();  
  response.json(completeWatchList);

});

app.get("/latest/anime", async(request, response,)=>{

  const latestAnime = db.prepare('SELECT * FROM anime WHERE watched = 0 ORDER BY creation_date DESC LIMIT 10').all();
  response.json(latestAnime);

});

app.get("/exists/movie", async(request, response,)=>{
  
  const movieID = movieExists.get(request.query.id);

  if(movieID){
    response.status(200).json({ exists: true });
  }else{
    response.status(200).json({ exists: false });
  }
});

app.get("/exists/series", async(request, response,)=>{
  
  const seriesID = seriesExists.get(request.query.id);

  if(seriesID){
    response.status(200).json({ exists: true });
  }else{
    response.status(200).json({ exists: false });
  }
});

app.get("/exists/anime", async(request, response,)=>{
  
  const animeID = animeExists.get(request.query.id);

  if(animeID){
    response.status(200).json({ exists: true });
  }else{
    response.status(200).json({ exists: false });
  }
});

app.post("/watched/movie", async(request, response,)=>{
  
  var watchedResult = selectMovieWatched.get(request.body.id).watched;

  if ( watchedResult == 1) {
    watchedResult = 0;
  } else {
    watchedResult = 1;
  }
   
  try {
    const modifiedWatched = updateMovieWatched.run(watchedResult, request.body.id);
    response.status(200).json({success: 'Modified Watched Status', status: watchedResult});
  } catch (err) {
    console.error(err);
    response.status(500).json({error: 'Failed to update watched status'});
  }

});

app.post("/watched/series", async(request, response,)=>{
  
  var watchedResult = selectSeriesWatched.get(request.body.id).watched;

  if ( watchedResult == 1) {
    watchedResult = 0;
  } else {
    watchedResult = 1;
  }
   
  try {
    const modifiedWatched = updateSeriesWatched.run(watchedResult, request.body.id);
    response.status(200).json({success: 'Modified Watched Status', status: watchedResult});
  } catch (err) {
    console.error(err);
    response.status(500).json({error: 'Failed to update watched status'});
  }

});

app.post("/watched/anime", async(request, response,)=>{
  
  var watchedResult = selectAnimeWatched.get(request.body.id).watched;

  if ( watchedResult == 1) {
    watchedResult = 0;
  } else {
    watchedResult = 1;
  }
   
  try {
    const modifiedWatched = updateAnimeWatched.run(watchedResult, request.body.id);
    response.status(200).json({success: 'Modified Watched Status', status: watchedResult});
  } catch (err) {
    console.error(err);
    response.status(500).json({error: 'Failed to update watched status'});
  }

});

app.get("/remove/movie", async(request, response,)=>{

  try {
    deleteMovie.run(request.query.id);
    response.status(200).json({success: 'Movie removed successfully'});
  } catch (err) {
    console.error(err);
    response.status(500).json({error: 'Failed to remove movie'});
  }
});

app.get("/remove/series", async(request, response,)=>{

  try {
    deleteSeries.run(request.query.id);
    response.status(200).json({success: 'Series removed successfully'});
  } catch (err) {
    console.error(err);
    response.status(500).json({error: 'Failed to remove series'});
  }
});

app.get("/remove/anime", async(request, response,)=>{

  try {
    deleteAnime.run(request.query.id);
    response.status(200).json({success: 'Anime removed successfully'});
  } catch (err) {
    console.error(err);
    response.status(500).json({error: 'Failed to remove anime'});
  }
});

// Listen for Requests
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});