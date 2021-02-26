var http = require("http");
var express = require("express");
var app = express();
var server = http.createServer(app)
var io = require('socket.io')(server);
var fs = require("fs")
app.use(express.static('public'))

app.get("/", (req, res) => {
    res.sendFile("index.html", {root: __dirname})

})

var file = 0;
var users = []
var videos = []
fs.readdirSync("./public/Movies/", (file) => {
    videos.push(file)
})
console.log(videos)
io.on("connection", (socket) => {
    socket.on("UserLogin", (data) =>{
        if(data.username == "Nox" && data.password == "NoxPass") {
            var randomID = Math.random(10000)
            socket.emit("verified", {verifed : true, ID: randomID})
            users.push(data.username)
            app.get("/Movies", (req, res) => {
                if(req.query.id == randomID){
                    
                    res.sendFile("Movie.html", {root: __dirname})
                    
                }
            })
            socket.emit("videos", videos)
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