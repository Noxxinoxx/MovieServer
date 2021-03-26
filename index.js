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

//add supprot for servers aka duel server one for downloading movies and one for storing and previewing movies;

var openParties = []
app.use("/Backgrounds/", express.static("public/Background/"))
app.use("/icons/", express.static("public/icons/"))
app.get("/", (req, res) => {
    res.sendFile("index.html", { root: __dirname });
});
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
        console.log(openParties)
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
        console.log(users)
        var arraycontainsturtles = users.indexOf(socket.id)
        console.log(arraycontainsturtles)
        users.splice(arraycontainsturtles, 1)
        console.log(users)

    });
});
io.of("/Movies").on("connection", (socket) => {
   
    socket.emit("listenToOpenParty", {Parties: openParties})


    socket.on("forceDownload", (data) => {
        ForceDownload(data.title, data.episode)
        console.log("jejej")
    })
    function ForceDownload(title, episode) {
        //https://v3.4animu.me/


        var title = title.split(" ", "-")
        console.log(title)
        var url = "https://v3.4animu.me/" + title + "-Episode-" + episode + ".mp4"
        console.log(url)



    }


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
        DownloadMovie(data)
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
        LoadnewMassDownloadData(MovieArray, data.nameColl);

    })
    var ih = 0;
    function LoadnewMassDownloadData(MovieArray, nameColll) {
        //problem is that it get called by an undefined becaus when the funkction is called again
        //the varibles are not defined.

        ih = ih + 1;
        if (Moviearray.length < ih) {
            socket.emit("DoneWithMassDownload")
            console.log("Done With Mass Download")

        }

        var dataa = {
            MovieDownloadCollectionName: nameColl,
            MovieDownloadButtonEpisodeName: Moviearray[ih],

        }
        DownloadMovie(dataa, true)
    }
    async function DownloadMovie(data, MassDownload) {
        var CollectionMovie = fs.readFileSync("./public/Movie/Collection/" + data.MovieDownloadCollectionName + ".json")
        var parsedColletion = JSON.parse(CollectionMovie)
        console.log(parsedColletion)
        var index = parsedColletion.episodes.findIndex(function (item, i) {
            return item.title === data.MovieDownloadButtonEpisodeName;
        });
        console.log(index)
        console.log(parsedColletion.episodes[index].url)

        await request({ uri: parsedColletion.episodes[index].url }, async function (error, res, body) {

            var stringThing = "";

            var getMovieDownloadLink = body.search(".mp4")


            loop1: for (var i = getMovieDownloadLink - 1; i >= 0; i--) {
                if (body.charAt(i) == '"') {
                    break loop1;
                } else {
                    stringThing += body.charAt(i);
                }
            }
            console.log(reverseString(stringThing) + ".mp4")
            var newLink = reverseString(stringThing) + ".mp4";
            String.prototype.replaceAt = function (index, replacement) {
                if (index >= this.length) {
                    return this.valueOf();
                }

                return this.substring(0, index) + replacement + this.substring(index + 1);
            }
            newLink = newLink.replaceAt(22, "0")

            var withoutSpaces = data.MovieDownloadButtonEpisodeName
            if (withoutSpaces.includes(" ")) {
                console.log("dfdf")
                withoutSpaces = withoutSpaces.split(" ").join("")
            }
            if (withoutSpaces.includes(":")) {
                console.log("hjhh")
                withoutSpaces = withoutSpaces.split(":").join("")
            }
            console.log(withoutSpaces)
            if (withoutSpaces.includes("–")) {
                console.log("hejjjjj")
                withoutSpaces = withoutSpaces.split("–").join("")
            }
            ///Users/nox/Documents/GitHub/MovieServer/public/Movie/SK∞Episode04.mp4
            if (withoutSpaces.includes("∞")) {
                withoutSpaces = withoutSpaces.split("∞").join("")
            }
            if (withoutSpaces.includes("&")) {
                withoutSpaces = withoutSpaces.split("&").join("")
            }

            var file = fs.createWriteStream("./public/Movie/" + withoutSpaces.replace(" ", "") + ".mp4")
            // om inte länken funkar så är det https://v6.4animu.me/Nanatsu-no-Taizai/Nanatsu-no-Taizai-Episode-01-1080p.mp4
            // https://v6.4animu.me/NameAvServer/NameAvSerien-Episod-Nummer-kvalite
            // all mellanrum blir bindessträck
            //https://mountainoservo0002.animecdn.com/SK8-the-Infinity/SK8-the-Infinity-Episode-01-1080p.mp4
            ///Users/nox/Documents/GitHub/MovieServer/public/Movie/BorutoNarutotheMovie–NarutogaHokageniNattaHiEpisode01.mp4
            //https://v3.4animu.me/

            try {
                var reqq = request({
                    method: "GET",
                    uri: newLink,
                })

                var responsedata;
                reqq.pipe(file)
                reqq.on('response', async function (dataa) {
                    console.log(dataa.headers['content-length']);
                    responsedata = dataa.headers['content-length'];
                    if (responsedata <= 300) {
                        socket.emit("alertMovieNotFound", { movieNotFound: "MovieNotFound!" })
                        console.log("no address")
                        var assemble = assembleNewLink(newLink, 0)
                        console.log("wankes here")
                        await DownloadFromOtherAdress(assemble, data, withoutSpaces.replace(" ", ""), MassDownload, 0);
                    } else {
                        reqq.on('data', async function (chunk) {
                            console.log(chunk.length);
                            socket.emit("DownloadBytes", { chunk: chunk, alldata: responsedata, title: data.MovieDownloadButtonEpisodeName })

                        });

                        reqq.on('end', async function () {

                            if (MassDownload == true) {
                                LoadnewMassDownloadData(null)
                            } else {
                                console.log("done req")
                                socket.emit("doneWithDownload")
                            }



                        });
                    }
                });

            } catch (err) {
                console.log(err)
            }
            console.log("done")
        })



    }
    function assembleNewLink(OldLink, ii) {
        var l = "https://mountainoservo0002.animecdn.com/SK8-the-Infinity/SK8-the-Infinity-Episode-01-1080p.mp4"

        var linkLength = OldLink.length;
        var getWhere = OldLink.search(".com")
        var LinkArray = [];
        console.log(getWhere, linkLength, OldLink[35 + 3])
        for (i = getWhere + 4; i < linkLength; i++) {
            LinkArray.push(OldLink[i])
        }
        console.log(LinkArray.join(""))
        var arrayOfURLS = ["https://v1.4animu.me", "https://v6.4animu.me", "https://v3.4animu.me"]
        var link = arrayOfURLS[ii] + LinkArray.join("");
        

        return link;
    }
    
    async function DownloadFromOtherAdress(newLink, data, filee, MassDownload, old) {
        // LINK : https://v6.4animu.me/Nanatsu-no-Taizai-Imashime-no-Fukkatsu/Nanatsu-no-Taizai-Imashime-no-Fukkatsu-Episode-01-1080p.mp4

        console.log("getCalled")
        var h = 0;
        h = h + old;
        try {
            var file = fs.createWriteStream("./public/Movie/" + filee + ".mp4")
            var reqq = request({
                method: "GET",
                uri: newLink,
            })
            reqq.pipe(file)
            var responsedata;
            reqq.on('response', async function (dataa) {
                console.log(dataa.headers['content-length']);
                responsedata = dataa.headers['content-length'];
                if (responsedata <= 300) {
                    socket.emit("alertMovieNotFound", { movieNotFound: "MovieNotFound!" })
                    console.log("no address")
                    var assemble = assembleNewLink(newLink, h)
                    await DownloadFromOtherAdress(assemble, data, file, MassDownload, h);
                } else {
                    reqq.on('data', async function (chunk) {
                        console.log(chunk.length);
                        socket.emit("DownloadBytes", { chunk: chunk, alldata: responsedata, title: data.MovieDownloadButtonEpisodeName })

                    });

                    reqq.on('end', async function () {

                        if (MassDownload == true) {
                            LoadnewMassDownloadData(null)
                        } else {
                            console.log("done req")
                            socket.emit("doneWithDownload")
                        }



                    });
                }
            });
        } catch (err) {
            console.log(err)
        }



        console.log("done")

        return "done";
    }

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
