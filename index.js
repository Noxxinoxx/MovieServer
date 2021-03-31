var http = require("http");
var express = require("express");
var app = express();
var server = http.createServer(app)
var io = require('socket.io')(server);
var fs = require("fs")
var https = require("https")
var request = require("request");
const { response } = require("express");
//no anime 
//gogoanime
//twist
//hentihaven
//animeflix
//4anime
//ryuanime
//animefreak
var { search, getAnime, getQualities } = require("anigrab").sites.siteLoader(
    "4anime"
);
var users = [];
let randomID;
let movieClicked;
var dataTitle;





async function AnimeSearch(searchWord) {
    try {
        const searchResult = await search(searchWord);
        console.log(searchResult + " " + searchWord);
        const { url } = searchResult[0];
        console.log(url);
        const anime = await getAnime(url);
        const episodeURL = anime.episodes[0].url;
        console.log(episodeURL);
        var stringData = JSON.stringify(anime);
        console.log(stringData);
        fs.writeFileSync(
            "./public/Movie/Collection/" + searchWord + ".json",
            stringData
        );
    } catch (error) {
        console.log(error);
    }
}

//fix watch together; done;
//Fix open rooms saver; witrh and array with the open rooms;
//Fix forced links;
//add user spersif things, like mark that you allready watched a movie or episode, remeber time on the episdes if you leave, chatloggs, partyloggs, and so on,
//add supprot for servers aka duel server one for downloading movies and one for storing and previewing movies;

var openParties = []
app.use("/Backgrounds/", express.static("public/Background/"))
app.use("/icons/", express.static("public/icons/"))
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: __dirname });
});


io.of("MovieDownloader").on("connection", (socket) => {
    socket.emit("hej")

    console.log({MovieServerConnection: true})

    socket.on("disconnect", (data) =>{
        console.log("MovieDownloaderServer Disconnected")
    })

})



io.of("/Wonder").on("connection", (socket) => {
    var partyOwner = false;
    socket.on("id", (data) => {
        socket.id = data;
        console.log(socket.id)
    })
    socket.on("VideoTime", (data) => {
        io.of("/Wonder").emit("videoTime", {CurrentTime: data})
    })

    socket.on("ClientopenParty", (data) => {
        partyOwner = true;
        var jsonObject = {
            title: data.title,
            id: data.id,
        }

        openParties.push(jsonObject)
        console.log(openParties)
        io.of("/Movies").emit("ClientopenPartyy", {title: data.title, id: data.id})
    })

    socket.emit("renderMovieFromHandleBars", {
        Title: movieClicked,
        ID: socket.id,
    });
    console.log("Users connected with aoutcode: " + socket.id);
    console.log("Movie that are played is: " + movieClicked);
    app.use("/static/" + socket.id, express.static("public"));
    socket.on("disconnect", () => {
        //if the socket is a open party owner and he disconnect it will take it away from the array;
        if(partyOwner == true) {
            for(g = 0; g < openParties.length; g++) {
                if(openParties[g].id == socket.id) {
                    openParties.splice(g, 1)
                    io.of("/Movies").emit("DeleteOpenParty", {id: socket.id})
                }
            }
            console.log(openParties)
        }
        console.log("user disconneected");
        var arraycontainsturtles = users.indexOf(socket.id)
        users.splice(arraycontainsturtles, 1)
    });
});
io.of("/Movies").on("connection", (socket) => {
   
    socket.emit("listenToOpenParty", {Parties: openParties})


    socket.on("forceDownload", (data) => {
        io.of("/MovieDownloader").emit("ForcedDownload", {title: data.title, episode: data.episode})
        console.log("jejej")
    })
    


    socket.on("id", (data) => {
        socket.id = data;
        console.log(socket.id)
    })


    socket.on("OpenParty", (data) => {
        app.get("/" + data.userID + "/" + data.movieTitle, (req, res) => {
            res.sendFile("test.html", { root: __dirname });
        })
    })
    var MovieFolde = fs.readdirSync("./public/Movie/");
    socket.emit("videos", { MovieFolder: MovieFolde, ID: socket.id });

    socket.on("animesearch", async (nameSearch) => {
        console.log("got Info " + nameSearch.MoviveTitle);
        var arrayOfDir = fs.readdirSync("./public/Movie/Collection/");

        if (arrayOfDir.includes(nameSearch.MoviveTitle + ".json")) {
            var dataFromDir = fs.readFileSync(
                "./public/Movie/Collection/" + nameSearch.MoviveTitle + ".json"
            );
            var parsedData = JSON.parse(dataFromDir);
            dataTitle = parsedData.episodes;
            console.log("this anime is already in the collection!")
            socket.emit("OnSearchResult", { dataTitle: dataTitle, nameCollection: nameSearch.MoviveTitle })
        } else {
            await AnimeSearch(nameSearch.MoviveTitle);
            var dataFromDir = fs.readFileSync(
                "./public/Movie/Collection/" + nameSearch.MoviveTitle + ".json"
            );
            var parsedData = JSON.parse(dataFromDir);
            dataTitle = parsedData.episodes;
            socket.emit("OnSearchResult", { dataTitle: dataTitle, nameCollection: nameSearch.MoviveTitle })
        }
    });
    socket.on("videoClicked", (data) => {
        socket.emit("movie", { Title: data.MovieClicked, ID: socket.id });
        movieClicked = data.MovieClicked;
        app.get("/" + socket.id + "/" + data.MovieClicked, (req, res) => {
            
            res.sendFile("test.html", { root: __dirname });
            
        })
    })
    socket.on("MovieClickedDownloadButton", async (data) => {
        
        io.of("/MovieDownloader").emit("DownloadMovie", data)
    })
    var Moviearray;
    var nameColl;
    socket.on("MovieMassDownloader", (data) => {
        console.log(data)
        var MovieArray = []
        for (i = 0; i < data.dataTitle.length; i++) {
            MovieArray.push(data.dataTitle[i].title)
        }
        Moviearray = MovieArray
        nameColl = data.nameColl;

        io.of("/MovieDownloader").emit("MassDownload", {MovieArray: MovieArray, nameColl: data.nameColl})
        

    })

})





io.of("/").on("connection", (socket) => {
    

    socket.on("UserLogin", (data) => {
        if (data.username == "Nox" && data.password == "NoxPass") {
            socket.emit("verified", { verifed: true, ID: socket.id });
            users.push(socket.id);
            console.log(users)
            app.get("/" + socket.id + "/Movies/", (req, res) => {
                
                res.sendFile("Movie.html", { root: __dirname });
                
            });

        } else {
            socket.emit("verified", { verifed: false });
        }
    });

});
server.listen(3001);
