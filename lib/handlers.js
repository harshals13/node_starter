/*
* Request handlers
*/

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

// Defining the handler
var handlers = {};

//Sample handler
handlers.ping = function(data, callback){
    // Callback a http status code, and a payload object
    callback(200);
};

// Not found handler
handlers.notFound = function(data, callback){
    callback(404);
};


// Handler for users
handlers.users = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for the users submethods
handlers._users = {};


// Users - POST; firstName, lastName, phone, password, toAgreement
// Optional data: none
// Required data
handlers._users.post = function(data, callback){
  // Check that all required fields are filled out
   var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
   var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
   var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
   var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
   var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

   if(firstName && lastName && phone && password && tosAgreement){
      // Make sure the user doesnt already exist
      _data.read('users', phone, function(err, data){
          if(err){
              // Hash the password
              var hashedPassword = helpers.hash(password);

              // Create the user object
              if(hashedPassword) {
                var userObject = {
                    'firstName' : firstName,
                    'lastName' : lastName,
                    'phone' : phone,
                    'hashedPassword': hashedPassword,
                    'tosAgreement' : true
                };
  
                // Store the user
                _data.create('users', phone, userObject, function(err){
                    if(!err){
                        callback(200);
                    } else {
                        console.log(err);
                        callback(500, {'Error' : 'Could not create a new user'});
                    }
                });
              } else {
                  callback(500, {'Error' : 'Could not hash the users\'s password'});
              }
          } else {
              // user alresdy exists
              callback(400, {'Error' : 'A user with that phone number already exists'});
          }
      });
   } else {
       callback( 400, {'Error' : 'Missing required fields'});
   }
   
};

// Users - GET
// Required data: phone
// Optional data: none
// @TODO Only let an authenticated user access their object. Dont let anyone else access the object
handlers._users.get = function(data, callback){
    // Chech that the phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim(): false;
    if(phone){
        // Lookup the user
        _data.read('users', phone, function(err, data){
            if(!err && data){
                // Remove the hashed password from the user object before returning it to the requester
                delete data.hashedPassword;
                callback(200, data); // This is the data that your getting back from the read function 

            } else {
                callback(404);
            }

        });
    }else {
        callback(400, {'Error': 'Missing reqquired field'});
    }
};

// Users - PUT
// Required data : phone
// Optional data: firstname,lastname, password(at least one must be specified)
// @TODO Only let an authenticated user update their own object. Dont allow them to update anyone else
handlers._users.put = function(data,callback){
    // Check for required field
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  
    // Check for optional fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  
    // Error if phone is invalid
    if(phone){
      // Error if nothing is sent to update
      if(firstName || lastName || password){
        // Lookup the user
        _data.read('users',phone,function(err,userData){
          if(!err && userData){
            // Update the fields if necessary
            if(firstName){
              userData.firstName = firstName;
            }
            if(lastName){
              userData.lastName = lastName;
            }
            if(password){
              userData.hashedPassword = helpers.hash(password);
            }
            // Store the new updates
            _data.update('users',phone,userData,function(err){
              if(!err){
                callback(200);
              } else {
                console.log(err);
                callback(500,{'Error' : 'Could not update the user.'});
              }
            });
          } else {
            callback(400,{'Error' : 'Specified user does not exist.'});
          }
        });
      } else {
        callback(400,{'Error' : 'Missing fields to update.'});
      }
    } else {
      callback(400,{'Error' : 'Missing required field.'});
    }
  
  };

// Users - DELETE
// Required data: phone
// @TODO Only let an authenticated user delete their object. Dont let them delete update elses.
// @TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = function(data,callback){
    // Check that phone number is valid
    var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){
      // Lookup the user
      _data.read('users',phone,function(err,data){
        if(!err && data){
          _data.delete('users',phone,function(err){
            if(!err){
              callback(200);
            } else {
              callback(500,{'Error':'Could not delete the specified user'});
            }
          });
        } else {
          callback(400,{'Error':'Could not find the specified user.'});
        }
      });
    } else {
      callback(400,{'Error':'Missing required field'})
    }
  };

  // Tokens
  handlers.tokens = function(data, callback) {
    var acceptableMethods = ['post', 'get', 'put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// Container for tokens sub methods
handlers._tokens = {}

// Tokens - post
// Required data is phone and password
// Optional data is null
handlers._tokens.post = function(data, callback){
    var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

   if(phone && password){
       // Lookup the user who matches that phone number
       _data.read('users', phone, function(err, userData){
           if(!err & userData){

           } else {
               callback(400, {'Error':'Could nit find the specified user'})
           }
       })

   }else {
       callback(400, {'Error': 'Missing required fields'});
   }
};

// Tokens - get
handlers._tokens.get = function(data, callback){

};

// Tokens - put
handlers._tokens.put = function(data, callback){

};

// Tokens - delete
handlers._tokens.delete = function(data, callback){

};


// Export the module
module.exports = handlers;