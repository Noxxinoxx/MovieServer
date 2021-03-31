var http = require("http");
var express = require("express");
var app = express();
var server = http.createServer(app)
var fs = require("fs")

var request = require("request");
var socket = require("socket.io-client")("ws://192.168.1.17:3001/MovieDownloader")
var path = require("path")




socket.on("hej", (data) => {
    console.log("ff")
})


socket.on("ForcedDownload", (data) => {
    ForceDownload(data.title, data.episode, -1, true)
    console.log("ForceDownloadMovie")
})

socket.on("DownloadMovie", (data) => {
    DownloadMovie(data)
    console.log("DownloadMovie")
})
socket.on("MassDownload", (data) => {
    
    LoadnewMassDownloadData(data.MovieArray, data.nameColl)
    console.log("MassDownload")
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
    var CollectionMovie = fs.readFileSync(path.join(__dirname + "/../public/Movie/Collection/" + data.MovieDownloadCollectionName + ".json"))
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

        var file = fs.createWriteStream(path.join(__dirname + "/../public/Movie/" + withoutSpaces.replace(" ", "") + ".mp4"))
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
        var file = fs.createWriteStream(path.join(__dirname + "/../public/Movie/" + filee + ".mp4"))
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
function ForceDownload(title, episode, interation, MassDownload) {
    //https://v3.4animu.me/
    interation = interation + 1;

    title = title.replace(" ", "-")

    console.log(title)
    var arrayOfURLS = ["https://v1.4animu.me", "https://v6.4animu.me", "https://v3.4animu.me"]
    var url = arrayOfURLS[interation] + "/" + title + "/" + title + "-Episode-" + episode + "-1080p" + ".mp4"

    console.log(url)

    try {
        var file = fs.createWriteStream(path.join(__dirname + "/../public/Movie/" + title + "Episode" + episode + ".mp4"))
        var reqq = request({
            method: "GET",
            uri: url,
        })
        reqq.pipe(file)
        var responsedata;
        reqq.on('response', async function (dataa) {
            console.log(dataa.headers['content-length']);
            responsedata = dataa.headers['content-length'];
            if (responsedata <= 300) {
                ForceDownload(title, episode, interation, true);
            } else {
                reqq.on('data', async function (chunk) {
                    console.log(chunk.length);
                    socket.emit("DownloadBytes", { chunk: chunk, alldata: responsedata, title: title })

                });

                reqq.on('end', async function () {

                    if (MassDownload == true) {

                        if (episode.indexOf("0") == 0) {
                            var indexOfEpisodeNumber = episode.indexOf("0") + 1;

                            var stringEpi = (parseInt(episode[indexOfEpisodeNumber]) + 1)
                            var s = "0"
                            s += stringEpi.toString();

                            ForceDownload(title, s, -1, true)

                        } else {
                            var eop = parseInt(episode) + 1
                            ForceDownload(title, eop, -1, true)
                        }



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



}

server.listen(5000)