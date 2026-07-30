//----------------------------------------------------------------//
//                      CONFIGURE ENTITIES                        //
//----------------------------------------------------------------//

const ENTITY_CONFIG = {
    movie: {
        entityText: "Movie",
        entityTextPlural: "Movies",
        listURL: "/list/movie", 
        searchURL: "/search/movie",
        watchedURL: "/watched/movie",
        removeURL: "/remove/movie",
        insertURL: "/insert/movie",
        existsURL: "/exists/movie",
        titleField: "title",
        dateField: "release_date",
        overviewField: "overview",
        posterURL: (p)=> `http://image.tmdb.org/t/p/w92${p}`,
    },
    series: {
        entityText: "Series",
        entityTextPlural: "Series",
        listURL: "/list/series", 
        searchURL: "/search/series",
        watchedURL: "/watched/series",
        removeURL: "/remove/series",
        insertURL: "/insert/series",
        existsURL: "/exists/series",
        titleField: "name",
        dateField: "first_air_date",
        overviewField: "overview",
        posterURL: (p)=> `http://image.tmdb.org/t/p/w92${p}`,
    },
    anime: {
        entityText: "Anime",
        entityTextPlural: "Anime",
        listURL: "/list/anime", 
        searchURL: "/search/anime",
        watchedURL: "/watched/anime",
        removeURL: "/remove/anime",
        insertURL: "/insert/anime",
        existsURL: "/exists/anime",
        titleField: "title_english",
        dateField: "first_air_date",
        overviewField: "overview",
        posterURL: (p)=> p,
    },    
};

//----------------------------------------------------------------//

let currentItems;
let allItems;
let itemResults;
let searchModalOpen; 

let global_config;          //entity configuration

const searchInput = document.getElementById("itemSearch");

//----------------------------------------------------------------//

function init(){
    const params = new URLSearchParams(window.location.search);
    const type   = params.get("type");

    const config = ENTITY_CONFIG[type];
    if(config){
      global_config = config;
      fetch_watch_list(config);

      document.title = `${config.entityTextPlural} List`;
      searchInput.placeholder = `Use search to add ${config.entityTextPlural}`;
    }
}//init

searchInput.addEventListener('keypress', (event) => {
    if(event.key == 'Enter'){
        itemResults = allItems;
        perform_search(searchInput.value);
        searchInput.value = "";
    }
})

async function fetch_watch_list() {
    //Read database and return all items

    const response = await fetch(global_config.listURL);
    const data = await response.json();

    allItems = data;
    currentItems = data;

    if ( allItems.length > 0){
        render_item_cards(allItems);
    }else{
        render_empty_list();
    }
    
}//fetch_watch_list

function render_empty_list(){
    const listarea = document.getElementById("itemCards");
    listarea.innerHTML = `
                            <div class = "emptyList">
                                <span><img src = "assets/sad/png" width = "128"></span>
                                <span>It's kind of lonely here...</span>
                                <span>Use the Search above to add ${global_config.entityTextPlural} to your collection!</span>
                            </div>
                         `
}//render_empty_list


function filter_watched_items(){
    let watchedItems = [];

    for(let i=0;i<allItems.length;i++){
        let item = allItems[i];

        if(item.watched == 1){
            watchedItems.push(item);
        }
    }

    if(watchedItems.length > 0){
        render_item_cards(watchedItems);
    }else{
        render_empty_list();
    }
} //filter_watched_items

function filter_unwatched_items(){
    let unwatchedItems = [];

    for(let i=0;i<allItems.length;i++){
        let item = allItems[i];

        if(item.watched == 0){
            unwatchedItems.push(item);
        }
    }

    if(unwatchedItems.length > 0){
        render_item_cards(unwatchedItems);
    }else{
        render_empty_list();
    }
} //filter_unwatched_items

function display_all_items(){
    if(allItems.length > 0){
        render_item_cards(allItems);
    }else{
        render_empty_list();
    }
}//display_all_items

function render_item_cards(items){

    const itemCards = document.getElementById("itemCards");
    itemCards.innerHTML = "";

    for(let i = 0;i<items.length;i++){
        let item = items[i];
        
        let watchIcon = item.watched === 1 ? "assets/watched_ok.png" : "assets/watched.png";
        let watchTxt = item.watched === 1 ? "Mark Unwatched" : "Mark Watched";  
        
        const itemCard = document.createElement("div");
        itemCard.className = 'itemCard';
        itemCard.innerHTML = `
                                <div class = "poster">
                                    <img src="${escapeHtml(global_config.posterURL(item.poster_path))}" width = "92">
                                </div>
                                <div class = "itemInfo">
                                    <h3>${escapeHtml(item[global_config.titleField])}</h3>
                                    <div class="itemDescription">${escapeHtml(item[global_config.overviewField])}</div>
                                    <div class = "itemFooter">
                                        <p>Release Date: ${escapeHtml(item[global_config.dateField])}</p>
                                            <div class = "btnAdd">
                                                <button type="submit" class="icon-button" id="btnyes-${item.id}" onclick="toggleWatched(this.id)">
                                                    <img src=${watchIcon} width="24">
                                                    ${watchTxt}
                                                </button>
                                                <button type="submit" class="icon-button" id="btnrmv-${item.id}" onclick="remove_from_list(this.id)">
                                                    <img src="assets/remove.png" width="24">
                                                    Remove
                                                 </button>                                                
                                            </div>
                                    </div>
                                </div>
                             `
        itemCards.appendChild(itemCard);
    }
}//render_item_cards

async function perform_search(searchTerm){
    const localSearchURL = `${global_config.searchURL}?${new URLSearchParams({query: searchTerm})}`;

    try {
        const response = await fetch(localSearchURL);
        const data = await response.json();

        //Store results in a global variable
        itemResults = data;

        if (response.status == 200){

            const statuses = await Promise.all(
                itemResults.map(item => check_if_item_exists(item.id))
            );
        
            itemResults.forEach((item, index) => {
            item.existStatus = statuses[index];
            });
        }      

        toggle_results_window();
        render_results_header(searchTerm);
        render_result_cards(itemResults);

    } catch (error) {
        console.error(error);
    }
}//perform_search

function toggle_results_window(){
    const searchResults = document.getElementById("searchResults");
    searchResults.style.display = searchResults.style.display == 'flex' ? 'none' : 'flex';
    document.body.style.overflow = "hidden" //disable background scrolling
    searchModalOpen = true; //for the key listener event to close modal
}//toggle_results_window  

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
}//render_results_header

function render_result_cards(items){
    const resultCards = document.getElementById("resultCards");
    resultCards.innerHTML = "";

    for(let i=0;i<items.length;i++){
        let item = items[i];

        let buttonHTML;

        if(item.existStatus == true){
          buttonHTML = `<button type="submit" class="icon-button" id=btnadd-${item.id}">
                          <img src="assets/folder_check.png" width="24">
                          Already in Watchlist 
                        </button>
                       `                 
        }else{
          buttonHTML = `<button type="submit" class="icon-button" id=btnadd-${item.id} onclick="add_to_watchlist(this.id)">
                          <img src="assets/add_to_list.png" width="24">
                          Add to Watchlist
                        </button>
                       `
        } 
        const resultCard = document.createElement("div");
        resultCard.className = "resultCard";
        resultCard.innerHTML = `
                                 <div class = "poster">
                                   <img src="${escapeHtml(global_config.posterURL(item.poster_path))}" width="92">
                                 </div>
                                 <div class="itemInfo">
                                  <h3>${escapeHtml(item[global_config.titleField])}</h3>
                                  <div class="itemDescription">${escapeHtml(item[global_config.overviewField])}</div>
                                  <div class="item-footer">
                                    <p>Release Date: ${escapeHtml(item[global_config.dateField])}</p>
                                      <div class="btnAdd">
                                        ${buttonHTML}
                                      </div>
                                  </div>
                                 </div>
                               `
        resultCards.appendChild(resultCard);        
        
    }
}//render_result_cards

async function check_if_item_exists(itemID) {
    const localExistsURL = `${global_config.existsURL}?${new URLSearchParams({id: itemID})}`;
    const response = await fetch(localExistsURL); 
    const data = await response.json();  
    return data.exists;
}//check_if_item_exists

function close_search_results() {
    document.getElementById("searchResults").style.display = "none";
    document.body.style.overflow = "auto";  // Re-enable scrolling
}//close_search_results

async function toggleWatched(buttonID){
    const idArray = buttonID.split("-");
    let itemID = idArray[1];

    const selectedItem = allItems.find(({ id }) => id === Number(itemID));
    const options = {
                        method: 'POST',
                        body: JSON.stringify({id: selectedItem.id}),
                        headers: {
                        'Content-Type': 'application/json',
                        'accept': 'application/json',
                        }
                    }; 

    const response = await fetch(global_config.watchedURL, options);
    const data = await response.json();

    let button = document.getElementById(`btnyes-${selectedItem.id}`);
     
    if (data.status == '1'){
        button.innerHTML = `<img src="assets/watched_ok.png" width="24"> Mark Unwatched`;
        selectedItem.watched = 1;
    }else {
        button.innerHTML = `<img src="assets/watched.png" width="24"> Mark Watched`;
        selectedItem.watched = 0;
    }    

}//toggleWatched

async function remove_from_list(buttonID){
    const idArray = buttonID.split("-");
    let itemID = idArray[1];

    const localRemoveURL = `${global_config.removeURL}?${new URLSearchParams({id: itemID})}`;

    if (confirm(`Remove ${global_config.entityText} from Watchlist?`)){
          const response = await fetch(localRemoveURL);
          const data = await response.json();

          const updatedItems = allItems.filter(item => item.id !== Number(itemID));

          allItems = updatedItems;
          render_item_cards(allItems);
    }
}//remove_from_list

function close_btn_hover(element){
    element.setAttribute('src', 'assets/close_x.png');
}

function close_btn_out(element){
    element.setAttribute('src', 'assets/close_wht.png');
}

async function add_to_watchlist(buttonID){
    const idArray = buttonID.split("-");
    let itemID = idArray[1];

    const selectedItem = itemResults.find(({ id }) => id === Number(itemID));

    try{

        const options = {
              method: 'POST',
              body: JSON.stringify(selectedItem),
              headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
              }
            };
        const response = await fetch(global_config.insertURL, options);   
        
        if(response.status == 200){
            let addBtn = document.getElementById(buttonID);
            addBtn.innerHTML = `
                                  <button type="submit" class="icon-button" id=${buttonID}>
                                    <img src="assets/folder_check.png" width="24">
                                    Added to Watchlist
                                  </button>
                                `
            addBtn.disabled = true;
            selectedItem.watched = 0; //set status to unwatched so filters work
            allItems.push(selectedItem);
            render_item_cards(allItems);            
        }

    } catch (error){
        console.error(error);
    }
}//add_to_watchlist

document.addEventListener("keydown", function(event) {
    if (event.keyCode == 83) {
        //Only prevent default and focus if the search box is NOT already focused
        if (document.activeElement !== document.getElementById("itemSearch")) {
            event.preventDefault();
            document.getElementById("itemSearch").focus();
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

    function escapeHtml(str){
        const div = document.createElement("div");
        div.textContent = str ?? "";
        return div.innerHTML;
    }