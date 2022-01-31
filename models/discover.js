const BASE_URL = "https://api.spotify.com/v1";
const axios = require("axios");
const { BadRequestError } = require("../expressError");

/** Disocver Model defines functions to call the Spotify API in order to
 *  search music and fetch data by artist, album, song or genre.
*/

class Discover {

    //  Function used to paginate through dsicover search results.

    static async paginate(url) {
        const headers = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.API_ACCESS_TOKEN
            }
        }
        const res = await axios.get(url, headers);

        return res.data;
    }

    // Fetches all genres from Spotify API.

    static async getGenres() {
        const headers = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.API_ACCESS_TOKEN
            }
        }
        const genres = await axios.get(`${BASE_URL}/recommendations/available-genre-seeds`, headers);
        
        return genres.data;
    }

    // Fetches new releases from Spotify API.

    static async getNewReleases() {
        const headers = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.API_ACCESS_TOKEN
            }
        }
        const newReleases = await axios.get(`${BASE_URL}/browse/new-releases`, headers);

        return newReleases.data;
    }


    // Fetching all Artists from Spotify API, filtered by searchTerm; can 
    // optionally be filtered by genre.

    static async getArtists(searchTerm, genre) {
        const headers = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.API_ACCESS_TOKEN
            }
        }
        let url;
        let q;

        if(searchTerm.length > 0) {
            let terms = searchTerm.split(' ');

            if(terms.length > 1) {
                terms = terms.join('%20')
            } else {
                terms = terms.join('');
            }

            if(genre.length > 0){
                q = `artist:${terms}%20genre:${genre}`;
            } else {
                q = `artist:${terms}`;
            }

            url = `${BASE_URL}/search?q=${q}&type=artist`;
        } else {
            throw new BadRequestError("Search term must be at least 1 character long");
        }

        const res = await axios.get(url, headers);

        return res.data;
    }

    // Fetches data on an individual artist, by id.

    static async getArtist(id) {
        const headers = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.API_ACCESS_TOKEN
            }
        }
        const artist = await axios.get(`${BASE_URL}/artists/${id}`, headers);

        return artist.data;
    }

    // Fetches an artist's albums, by id.

    static async getArtistAlbums(id) {
        const headers = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.API_ACCESS_TOKEN
            }
        }
        const albums = await axios.get(`${BASE_URL}/artists/${id}/albums`, headers);

        return albums.data;
    }

    // Fetches an artist's top tracks.

    static async getArtistTopTracks(id) {
        const headers = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.API_ACCESS_TOKEN
            }
        }
        const topTracks = await axios.get(`${BASE_URL}/artists/${id}/top-tracks?country=us`, headers);

        return topTracks.data;
    }


    // Fetches all Albums from Spotify API, filtered on 
    // searchTerm.

    static async getAlbums(searchTerm) {
        const headers = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.API_ACCESS_TOKEN
            }
        }
        let url;
        let q;

        if(searchTerm.length > 0) {
            let terms = searchTerm.split(' ');

            if(terms.length > 1) {
                terms = terms.join('%20')
            } else {
                terms = terms.join('');
            }

            q = `album:${terms}`;
            url = `${BASE_URL}/search?q=${q}&type=album`;
        } else {
            throw new BadRequestError("Search term must be at least 1 character long");
        }

        const res = await axios.get(url, headers);

        return res.data;
    }

    // Fetches individual album data, by id.

    static async getAlbum(id) {
        const headers = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.API_ACCESS_TOKEN
            }
        }
        const album = await axios.get(`${BASE_URL}/albums/${id}`, headers);

        return album.data;
    }

    // Fetches all songs from Spotify API, filtered by searchTerm.

    static async getSongs(searchTerm) {
        const headers = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.API_ACCESS_TOKEN
            }
        }
        let url;
        let q;

        if(searchTerm.length > 0) {
            let terms = searchTerm.split(' ');
            if(terms.length > 1) {
                terms = terms.join('%20')
            } else {
                terms = terms.join('');
            }
            q = `track:${terms}`;
            
            url = `${BASE_URL}/search?q=${q}&type=track`;
        } else {
            throw new BadRequestError("Search term must be at least 1 character long");
        }

        const res = await axios.get(url, headers);

        return res.data;
    }

    // Fetching several tracks from Spotify API using string of ids

    static async getSeveralTracks(ids) {
        const headers = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.API_ACCESS_TOKEN
            }
        }
        const url = `https://api.spotify.com/v1/tracks?ids=${ids}`;
        const res = await axios.get(url, headers);

        return res.data;
    }
}


module.exports = Discover;