var http = require("http");
var express = require("express");
var app = express();
var server = http.createServer(app)
var io = require('socket.io')(server);
var fs = require("fs")
var https = require("https")
var request = require("request")
//no anime 
//gogoanime
//twist
//hentihaven
//animeflix
//4anime
//ryuanime
//animefreak
var {search, getAnime, getQualities} = require("anigrab").sites.siteLoader("4anime")
var qualities;
var users = []
let randomID;
let movieClicked;
var dataTitle;
async function AnimeSearch(searchWord) {
    try{
        const searchResult = await search(searchWord);
        console.log(searchResult + " " + searchWord)
        const {url} = searchResult[0]
        console.log(url)
        const anime = await getAnime(url)
        const episodeURL = anime.episodes[0].url;
        console.log(episodeURL)
        var stringData = JSON.stringify(anime)  
        console.log(stringData)   
        fs.writeFileSync("./public/Movie/Collection/" + searchWord + ".json", stringData)
    } catch(error) {
        console.log(error)
    }
    
}
app.get("/", (req, res) => {
    res.sendFile("index.html", {root: __dirname})
})
io.of("/Wonder").on("connection", (socket) => {
    socket.emit("renderMovieFromHandleBars", {Title: movieClicked, ID: randomID})
    console.log("Users connected with aoutcode: " + randomID)
    console.log("Movie that are played is: " + movieClicked)
    app.use('/static/' + randomID, express.static('public'))

})
io.of("/Movies").on("connection", (socket) => {
    var MovieFolder = fs.readdirSync("./public/Movie/")
    socket.emit("videos", MovieFolder)
    
    socket.on("animesearch", async (nameSearch) => {
        console.log("got Info " + nameSearch.MoviveTitle)
        var arrayOfDir = fs.readdirSync("./public/Movie/Collection/")
        
        if(arrayOfDir.includes(nameSearch.MoviveTitle + ".json")) {
            var dataFromDir = fs.readFileSync("./public/Movie/Collection/" + nameSearch.MoviveTitle + ".json")
            var parsedData = JSON.parse(dataFromDir)
            dataTitle = parsedData.episodes;
            console.log("this anime is already in the collection!")
            socket.emit("OnSearchResult", {dataTitle: dataTitle , nameCollection: nameSearch.MoviveTitle})
        }else {
            await AnimeSearch(nameSearch.MoviveTitle);
            var dataFromDir = fs.readFileSync("./public/Movie/Collection/" + nameSearch.MoviveTitle + ".json")
            var parsedData = JSON.parse(dataFromDir)
            dataTitle = parsedData.episodes;
            socket.emit("OnSearchResult", {dataTitle: dataTitle, nameCollection: nameSearch.MoviveTitle})
        }
    })
    socket.on("videoClicked", (data) => {
        socket.emit("movie", {Title: data.MovieClicked, ID: randomID})
        movieClicked = data.MovieClicked;
        app.get("/" + data.MovieClicked, (req, res) => {
            console.log(req.query.id)
            console.log(randomID)
            if(req.query.id == randomID){
                res.sendFile("test.html", {root: __dirname})
            }else {
                console.log("hehe")
                res.status(404)
            }
        })
    })
    socket.on("MovieClickedDownloadButton", async (data) => {
        var CollectionMovie = fs.readFileSync("./public/Movie/Collection/" + data.MovieDownloadCollectionName + ".json")
        var parsedColletion = JSON.parse(CollectionMovie)
        console.log(parsedColletion)
        var index = parsedColletion.episodes.findIndex(function(item, i) {
            return item.title === data.MovieDownloadButtonEpisodeName;
        });
        console.log(index)
        console.log(parsedColletion.episodes[index].url)
        
        await request({uri:parsedColletion.episodes[index].url}, async function(error, res, body) {
            
            var stringThing = "";
            console.log(body)
            var getMovieDownloadLink = body.search(".mp4")
            console.log(getMovieDownloadLink)

            loop1 : for(var i = getMovieDownloadLink - 1; i >= 0; i-- ) {
                if(body.charAt(i) == '"') {
                    break loop1;
                }else{
                    stringThing += body.charAt(i);
                }
            }
            console.log(reverseString(stringThing) + ".mp4")
            var newLink = reverseString(stringThing) + ".mp4";
            String.prototype.replaceAt = function(index, replacement) {
                if (index >= this.length) {
                    return this.valueOf();
                }
             
                return this.substring(0, index) + replacement + this.substring(index + 1);
            }
            newLink = newLink.replaceAt(22, "0")
            console.log(newLink)
            var withoutSpaces = data.MovieDownloadButtonEpisodeName.replace(" ", "")
            var file = fs.createWriteStream("./public/Movie/" + withoutSpaces.replace(" ", "") + ".mp4")
            //https://mountainoservo0002.animecdn.com/SK8-the-Infinity/SK8-the-Infinity-Episode-01-1080p.mp4
            
            try{
                var reqq = request({
                    method: "GET", 
                    uri: newLink,
                })
                reqq.pipe(file) 
                reqq.on('data', function (chunk) {
                    console.log(chunk.length);
                });
                reqq.on( 'response', function ( dataa ) {
                    console.log( dataa.headers[ 'content-length' ] );
                } );
                reqq.on('end', function() {
                    console.log("done req")
                });   
            }catch(err){
                console.log(err)
            }
            console.log("done")
        })

        

    })

    socket.on("disconnect", (user) => {
        console.log("Video viewer disconneced")
    })
})

function reverseString(str) {
    // Step 1. Use the split() method to return a new array
    var splitString = str.split(""); // var splitString = "hello".split("");
    // ["h", "e", "l", "l", "o"]
 
    // Step 2. Use the reverse() method to reverse the new created array
    var reverseArray = splitString.reverse(); // var reverseArray = ["h", "e", "l", "l", "o"].reverse();
    // ["o", "l", "l", "e", "h"]
 
    // Step 3. Use the join() method to join all elements of the array into a string
    var joinArray = reverseArray.join(""); // var joinArray = ["o", "l", "l", "e", "h"].join("");
    // "olleh"
    
    //Step 4. Return the reversed string
    return joinArray; // "olleh"
}
io.of("/").on("connection", (socket) => {
    randomID = Math.random(10000)
    socket.on("UserLogin", (data) =>{
        if(data.username == "Nox" && data.password == "NoxPass") {
            socket.emit("verified", {verifed : true, ID: randomID})
            users.push(data.username)
            app.get("/Movies/", (req, res) => {
                if(req.query.id == randomID){
                    res.sendFile("Movie.html", {root: __dirname})
                }else {
                    res.status(404)
                }
            })
        }else {
            socket.emit("verified", {verifed: false})
        }
    })
    socket.on("disconnect",(user) => {
        console.log("user disconneected")
        users = []
    })
})
server.listen(3001)