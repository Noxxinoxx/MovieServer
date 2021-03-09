var http = require("http");
var express = require("express");
var app = express();
var server = http.createServer(app);
var io = require("socket.io")(server);
var fs = require("fs");
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
var qualities;
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
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: __dirname });
});
io.of("/Wonder").on("connection", (socket) => {
    socket.emit("renderMovieFromHandleBars", {
        Title: movieClicked,
        ID: randomID,
    });
    console.log("Users connected with aoutcode: " + randomID);
    console.log("Movie that are played is: " + movieClicked);
    app.use("/static/" + randomID, express.static("public"));
});
io.of("/Movies").on("connection", (socket) => {
    var MovieFolder = fs.readdirSync("./public/Movie/");
    socket.emit("videos", MovieFolder);

    socket.on("animesearch", async (nameSearch) => {
        console.log("got Info " + nameSearch.MoviveTitle);
        var arrayOfDir = fs.readdirSync("./public/Movie/Collection/");

        if (arrayOfDir.includes(nameSearch.MoviveTitle + ".json")) {
            var dataFromDir = fs.readFileSync(
                "./public/Movie/Collection/" + nameSearch.MoviveTitle + ".json"
            );
            var parsedData = JSON.parse(dataFromDir);
            dataTitle = parsedData.episodes;
            console.log("this anime is already in the collection!");
            socket.emit("OnSearchResult", { dataTitle: dataTitle });
        } else {
            await AnimeSearch(nameSearch.MoviveTitle);
            var dataFromDir = fs.readFileSync(
                "./public/Movie/Collection/" + nameSearch.MoviveTitle + ".json"
            );
            var parsedData = JSON.parse(dataFromDir);
            dataTitle = parsedData.episodes;
            socket.emit("OnSearchResult", { dataTitle: dataTitle });
        }
    });
    socket.on("videoClicked", (data) => {
        socket.emit("movie", { Title: data.MovieClicked, ID: randomID });
        movieClicked = data.MovieClicked;
        app.get("/" + data.MovieClicked, (req, res) => {
            console.log(req.query.id);
            console.log(randomID);
            if (req.query.id == randomID) {
                res.sendFile("test.html", { root: __dirname });
            } else {
                console.log("hehe");
                res.status(404);
            }
        });
    });
    socket.on("disconnect", (user) => {
        console.log("Video viewer disconneced");
    });
});
io.of("/").on("connection", (socket) => {
    randomID = Math.random(10000);
    socket.on("UserLogin", (data) => {
        if (data.username == "Nox" && data.password == "NoxPass") {
            socket.emit("verified", { verifed: true, ID: randomID });
            users.push(data.username);
            app.get("/Movies/", (req, res) => {
                if (req.query.id == randomID) {
                    res.sendFile("Movie.html", { root: __dirname });
                } else {
                    res.status(404);
                }
            });
        } else {
            socket.emit("verified", { verifed: false });
        }
    });
    socket.on("disconnect", (user) => {
        console.log("user disconneected");
        users = [];
    });
});
server.listen(3001);
