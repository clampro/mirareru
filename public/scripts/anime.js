    let currentAnime; 
    let allAnime;
    let animeResults;

    let searchModalOpen;

    const searchInput = document.getElementById("movieSearch");

    searchInput.addEventListener('keypress', (event) => {
      if(event.key == 'Enter'){

        animeResults = allAnime;
        perform_search(searchInput.value);
        searchInput.value = "";
      }
    })

    async function fetch_anime_watch_list() {
      //read database and return all anime
        const localDisplayURL = "/list/anime";

        const response = await fetch(localDisplayURL);
        const data = await response.json();        

        allAnime = data;
        currentAnime = data;
        
        if (  allAnime.length > 0){
          render_anime_cards(allAnime);
        }else {
          render_empty_list();
        }
    }

    function render_empty_list(){
      const listarea = document.getElementById("itemCards");
      listarea.innerHTML = `
                            <div class = "emptyList">
                              <span><img src = "assets/sad.png" width = "128"></span>
                              <span>It's kind of lonely here...</span>
                              <span>Use the Search Above to add anime to your list and build an awesome collection!</span>
                            </div>
                           `
    }

    function filter_watched_anime() {
      let watchedAnime = [];

      for( let i=0;i<allAnime.length;i++){
        let anime = allAnime[i];

        if(anime.watched == 1){
          watchedAnime.push(anime);
        }
      }
      
      if (watchedAnime.length > 0){
        render_anime_cards(watchedAnime);
      }else{
        render_empty_list();
      }
    } //filter_watched_anime

    function filter_unwatched_anime() {
      let unwatchedAnime = [];

      for( let i=0;i<allAnime.length;i++){
        let anime = allAnime[i];

        if(anime.watched == 0){
          unwatchedAnime.push(anime);
        }
      }
      
      if (unwatchedAnime.length > 0){
        render_anime_cards(unwatchedAnime);
      }else{
        render_empty_list();
      }
    } //filter_unwatched_anime   

    function display_all_anime(){
      if(allAnime.length > 0){
        render_anime_cards(allAnime);
      }else{
        render_empty_list();
      }
    }

    function render_anime_cards(animeSeries) {

      const animeCards = document.getElementById("itemCards");
      animeCards.innerHTML = "";

      for( let i=0;i<animeSeries.length;i++){
        let anime = animeSeries[i];

        //Detemine Watched Status Icon
        let watchIcon = anime.watched === 1 ? "assets/watched_ok.png" : "assets/watched.png";
        let watchTxt = anime.watched === 1 ? "Mark Unwatched" : "Mark Watched";        

        const animeCard = document.createElement("div");
          animeCard.className = 'itemCard';
          animeCard.innerHTML = `<div class="poster">
                                   <img src="${anime.poster_path}" width="92">
                                 </div>
                                 <div class="movieInfo">
                                   <h3>${anime.title_english}</h3>
                                   <div class="movieDescription">${anime.overview}</div>
                                   <div class="movie-footer">
                                      <p>Release Date: ${anime.first_air_date}</p>
                                        <div class="btnAdd">
                                          <button type="submit" class="icon-button" id="btnyes-${anime.id}" onclick="toggleWatched(this.id)">
                                             <img src=${watchIcon} width="24">
                                             ${watchTxt}
                                          </button>     
                                          <button type="submit" class="icon-button" id="btnrmv-${anime.id}" onclick="remove_from_list(this.id)">
                                            <img src="assets/remove.png" width="24">
                                            Remove
                                          </button>
                                        </div>                                   
                                   </div>
                                   </div>
                                 `
        animeCards.appendChild(animeCard);            
      }
    } //render_anime_cards

    async function perform_search(searchTerm) {
      const localSearchURL = `/search/anime?${new URLSearchParams({q: searchTerm})}`;

      try {

        const response = await fetch(localSearchURL);
        const data = await response.json();

        //Store results in a global variable
        animeResults = data;

        const statuses = await Promise.all(
          animeResults.map(anime => check_if_anime_exists(anime.id))
        );

        animeResults.forEach((anime, index) => {
          anime.existStatus = statuses[index];
        });   
        

        toggle_results_window();
        render_results_header(searchTerm);
        render_result_cards(animeResults);

      } catch (error) {
        console.log(error.message);
      }
    }

    function toggle_results_window(){
      const searchResults = document.getElementById("searchResults");
      searchResults.style.display = searchResults.style.display == 'flex' ? 'none' : 'flex';
      document.body.style.overflow = "hidden" //disable background scrolling
      searchModalOpen = true;
    }    

    function render_results_header(searchTerm) {
      const resultsHeader = document.getElementById("resultsHeader");

      resultsHeader.innerHTML = `
                                  <div>
                                    <h2>Search Results</h2>
                                    <span class="searchTerm"><p>for "${searchTerm}"<p></span>
                                  </div>
                                  <div>
                                    <button type="button" class="butx" id="butx" onclick="close_search_results()">
                                      <img src="assets/close_wht.png" width="42" onmouseover="close_btn_hover(this);" onmouseout="close_btn_out(this);">
                                    </button>
                                  </div>
                                `;
    }

    function render_result_cards(animeSeries) {

      const resultCards = document.getElementById("resultCards");
      resultCards.innerHTML = ""; //clear search results

      for( let i=0;i<animeSeries.length;i++){
        let anime = animeSeries[i];

        let buttonHTML;
        if(anime.existStatus == true){
          buttonHTML = `<button type="submit" class="icon-button" id=btnadd-${anime.id}">
                          <img src="assets/folder_check.png" width="24">
                          Already in Watchlist 
                        </button>
                       `
        }else{
          buttonHTML = `<button type="submit" class="icon-button" id=btnadd-${ anime.id} onclick="add_to_watchlist(this.id)">
                          <img src="assets/add_to_list.png" width="24">
                          Add to Watchlist
                        </button>
                       `
        }

        const resultCard = document.createElement("div");
        resultCard.className = "resultCard";
        resultCard.innerHTML = `
                                 <div class = "poster">
                                   <img src="${anime.poster_path}" width="92">
                                 </div>
                                 <div class="movieInfo">
                                  <h3>${anime.title_english}</h3>
                                  <div class="movieDescription">${anime.overview}</div>
                                  <div class="movie-footer">
                                    <p>Release Date: ${anime.first_air_date}</p>
                                      <div class="btnAdd">
                                        ${buttonHTML}
                                      </div>
                                  </div>
                                 </div>
                               `
        resultCards.appendChild(resultCard);
      }
    }

    async function check_if_anime_exists(animeID) {
      const localExistsURL = `/exists/anime?${new URLSearchParams({id: animeID})}`;
      const response = await fetch(localExistsURL); 
      const data = await response.json();  
      
      return data.exists;
    }    

    function close_search_results() {
      document.getElementById("searchResults").style.display = "none";
      document.body.style.overflow = "auto";  // Re-enable scrolling
    }
    
    async function toggleWatched(buttonID){

      const idArray = buttonID.split("-");
      let animeID = idArray[1];

      const localWatchedURL = "/watched/anime";          

      const selectedAnime = allAnime.find(({ id }) => id === Number(animeID));

      const options = {
                        method: 'POST',
                        body: JSON.stringify({id: selectedAnime.id}),
                        headers: {
                        'Content-Type': 'application/json',
                        'accept': 'application/json',
                        }
                      }; 

      const response = await fetch(localWatchedURL, options);
      const data = await response.json();      
      
      let button = document.getElementById(`btnyes-${selectedAnime.id}`);
     
      if (data.status == '1'){
        button.innerHTML = `<img src="assets/watched_ok.png" width="24"> Mark Unwatched`;
        selectedAnime.watched = 1;
      }else {
        button.innerHTML = `<img src="assets/watched.png" width="24"> Mark Watched`;
        selectedAnime.watched = 0;
      }
    } //toggleWatched

    async function remove_from_list(buttonID) {
        const idArray = buttonID.split("-");
        let animeID = idArray[1];
        
        const localRemoveURL = `/remove/anime?${new URLSearchParams({id: animeID})}`;
        
        if (confirm('Remove anime from Watchlist?')){
          const response = await fetch(localRemoveURL);
          const data = await response.json();

          const updatedAnime = allAnime.filter(anime => anime.id !== Number(animeID));

          allAnime = updatedAnime;
          render_anime_cards(allAnime);
        }
    } //remove_from_list

    function close_btn_hover(element){
      element.setAttribute('src', 'assets/close_x.png');
    }

    function close_btn_out(element){
      element.setAttribute('src', 'assets/close_wht.png');
    }

    async function add_to_watchlist(buttonID) {
      const idArray = buttonID.split("-");
      let animeID = idArray[1];  
      
      const selectedAnime = animeResults.find(({ id }) => id === Number(animeID));
      
      try {

        const insertURL = "/insert/anime";
        const options = {
              method: 'POST',
              body: JSON.stringify(selectedAnime),
              headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
              }
            };
        const response = await fetch(insertURL, options);

        if (response.status == 200){
          let addBtn = document.getElementById(buttonID);
          addBtn.innerHTML = `
                              <button type="submit" class="icon-button" id=${buttonID}>
                                <img src="assets/folder_check.png" width="24">
                                Added to Watchlist
                              </button>
                             `
          addBtn.disabled = true;
          selectedAnime.watched = 0; //set status to unwatched so filters work
          allAnime.push(selectedAnime);
          render_anime_cards(allAnime);
        }

      } catch (error) {
        console.log(error.message);
      }
    }
    
    document.addEventListener("keydown", function(event) {
      if (event.keyCode == 83) {
        //Only prevent default and focus if the search box is NOT already focused
        if (document.activeElement !== document.getElementById("movieSearch")) {
          event.preventDefault();
          document.getElementById("movieSearch").focus();
        }
       }
    });

    const searchResultsModal = document.getElementById("searchResults");

    searchResultsModal.addEventListener('click', (event)=> {
      if (event.target === searchResultsModal){
        close_search_results();
      }
    });

    document.addEventListener("keydown", function(event) {
      if (event.keyCode == 27){ //escape key pressed
        if (searchModalOpen == true){
          searchModalOpen = false;
          close_search_results();
        }
      }
    });
