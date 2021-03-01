var http = require("http");
var express = require("express");
var app = express();
var server = http.createServer(app)
var io = require('socket.io')(server);
var fs = require("fs")



app.get("/", (req, res) => {
    res.sendFile("index.html", {root: __dirname})
    
})


var users = []
let randomID;
let movieClicked;

io.of("/Wonder").on("connection", (socket) => {
    socket.emit("renderMovieFromHandleBars", {Title: movieClicked, ID: randomID})
    console.log("jjj")
    app.use('/static/' + randomID, express.static('public'))
})

io.of("/Movies").on("connection", (socket) => {
    var MovieFolder = fs.readdirSync("./public/Movie/")
    socket.emit("videos", MovieFolder)
    socket.on("disconnect", (user) => {
       
        console.log("Video viewer disconneced")
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
    
    
})
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