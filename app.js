var url = require('url');
var http = require('http');
var stringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');

// Create and starting server

var server = http.createServer(function(req, res){
    // Get the URL and parse it
    var parsedUrl = url.parse(req.url, true);

    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //Get the query string
    var queryString = parsedUrl.query;

    //Get the request header
    var header = req.headers;

    // Get the http method
    var method = req.method.toLowerCase();

    // getting the payload, if any
    var decoder = new stringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data){
        buffer +=decoder.write(data);
    });
    req.on('end', function(){
        buffer += decoder.end(data);

    // Choose the handler this request should go to. If not found use the not found handler
    var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to the handler
    var data = {
        'trimmedPath' : trimmedPath,
        'queryStringObject' : queryString,
        'method': method,
        'headers': header,
        'payload': buffer
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, function(statusCode, payload){
    // Use the status code called back by the handler, or default to 200
    statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

    // Use the payload called back by the handler, or default to
    payload = typeof(payload) == 'object' ? payload : {};

    // Convert the payload to a string
    var payloadString = JSON.stringify(payload);

    // Return the response
    res.writeHead(statusCode);
    res.end(payloadString);

    // Log the request path
    console.log('Returning this response', statusCode, payloadString);
    });
  });
});


//Making the server lissten on port 1326
server.listen(config.port, function(){
    console.log("The server is listening on port " + config.port + " in " + config.envName + " mode ");
});

// Defining the handler
var handlers = {};

//Sample handler
handlers.hello = function(data, callback){
    // Callback a http status code, and a payload object
    callback(200, {'message' : 'Hello! Welcome to the Node application'})
};

// Not found handler
handlers.notFound = function(data, callback){
    callback(404)
};

// Defining a router
var router ={
    'hello' : handlers.hello
}