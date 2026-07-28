    async function fetch_what_to_watch() {
        //read database and return latest Movies, Series and Anime

        const localLatestMoviesURL = "/latest/movies";
        const localLatestSeriesURL = "/latest/series";
        const localLatestAniimeURL = "/latest/anime";

        const responseMovies = await fetch(localLatestMoviesURL);
        const latestMovies = await responseMovies.json();

        const responseSeries = await fetch(localLatestSeriesURL);
        const latestSeries = await responseSeries.json();
        
        const responseAnime = await fetch(localLatestAniimeURL);
        const latestAnime = await responseAnime.json();

        render_movies_carusel(latestMovies);
        render_series_carusel(latestSeries);
        render_anime_carusel(latestAnime);
        
    }

    function render_movies_carusel(movies){
        const moviesCarusel = document.getElementById("movieCarousel");
        moviesCarusel.innerHTML = "";

        for( let i=0;i<movies.length;i++){
            let movie = movies[i];

            const movieVCard = document.createElement("div");
            movieVCard.className = 'vCard';
            movieVCard.innerHTML = `
                                    <img
                                        class="vPoster"
                                        src="http://image.tmdb.org/t/p/w92${movie.poster_path}"
                                        alt="${movie.title}">
                                    <div class="vName">${movie.title}</div>                                    
                                   `
            moviesCarusel.appendChild(movieVCard);                       
        }

    }

    function render_series_carusel(series){
        const seriesCarousel = document.getElementById("seriesCarousel");
        seriesCarousel.innerHTML = "";

        for( let i=0;i<series.length;i++){
            let seriesItem = series[i];

            const seriesVCard = document.createElement("div");
            seriesVCard.className = 'vCard';
            seriesVCard.innerHTML = `
                                        <img
                                            class="vPoster"
                                            src="http://image.tmdb.org/t/p/w92${seriesItem.poster_path}"
                                            alt="${seriesItem.name}">
                                        <div class="vName">${seriesItem.name}</div>   
                                    `
            seriesCarousel.appendChild(seriesVCard);
        }


    }

    function render_anime_carusel(animeSeries){
        const animeCarousel = document.getElementById("animeCarousel");
        animeCarousel.innerHTML = "";

        for( let i=0;i<animeSeries.length;i++){
            let  anime = animeSeries[i];

            const animeVCard = document.createElement("div");
            animeVCard.className = 'vCard';
            animeVCard.innerHTML = `
                                        <img
                                            class="vPoster"
                                            src="${anime.poster_path}"
                                            alt="${anime.title_english}">
                                        <div class="vName">${anime.title_english}</div>   
                                    `
            animeCarousel.appendChild(animeVCard);
        }
    }