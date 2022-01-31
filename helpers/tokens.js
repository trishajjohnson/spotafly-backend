const jwt = require("jsonwebtoken");
const axios = require('axios');
const { CLIENT_ID } = require("../config");
const { CLIENT_SECRET } = require("../config");
const { SECRET_KEY } = require("../config");
const { API_ACCESS_TOKEN } = require("../config");
const Buffer = require("buffer").Buffer;
const { URLSearchParams } = require("url");

/** Requests from Spotify API an access_token in order to call
 * endpoints, saves it as an evironmental variable, then returns 
 * token to frontend for authorization. */

async function createToken(user) {
  const url = 'https://accounts.spotify.com/api/token';
  const authOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + (new Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
    },  
    data: new URLSearchParams({grant_type: 'client_credentials'})
  };

  const token = await axios(url, authOptions);
  process.env.API_ACCESS_TOKEN = token.data.access_token;
  let payload = {
    username: user.username,
  };
  
  return jwt.sign(payload, SECRET_KEY);
}


module.exports = { createToken };
