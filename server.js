const mongo = require('mongodb').MongoClient;
var express = require('express');
const client = require('socket.io').listen(4000).sockets;
var bodyParser = require('body-parser');
var app = express();
var urlencodedParser = bodyParser.urlencoded({extended:false});
app.use(express.static('public'));
app.get('/home',function(req,res){
    res.sendFile(__dirname + "/" + "home.html");
});
app.post('/chat',urlencodedParser,function(req,res){
    var response = {
        name:req.body.username,
        email:req.body.email,
        pass:req.body.pass
    }
    res.sendFile(__dirname + "/" + "index.html");
    mongo.connect('mongodb://127.0.0.1/mongochat', function(err, db){
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    client.on('connection', function(socket){
        let chat = db.collection('chats');


        sendStatus = function(s){
            socket.emit('status', s);
        }

        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            socket.emit('output', res);
        });

        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            if(name == '' || message == ''){
                sendStatus('Please enter a name and message');
            } else {
                chat.insert({name: name, message: message}, function(){
                    client.emit('output', [data]);

                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        socket.on('clear', function(data){
            chat.remove({}, function(){
                socket.emit('cleared');
            });
        });
    });
    });
});
app.listen(8080);