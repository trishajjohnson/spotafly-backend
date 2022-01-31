"use strict";

/** Routes for common discover functions. */

const jsonschema = require("jsonschema");

const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Discover = require("../models/discover");
const musicSearchAuthSchema = require("../schemas/musicSearch.json")
const router = express.Router();


router.get("/paginate", ensureLoggedIn, async function (req, res, next) {
    try {
        const { url } = req.query;
        const result = await Discover.paginate(url);
        return res.json({ result });
    } catch (err) {
        return next(err);
    }
});

router.get("/genres", ensureLoggedIn, async function (req, res, next) {
    try {
      const genres = await Discover.getGenres();
      return res.json({ genres });
    } catch (err) {
      return next(err);
    }
});

router.get("/new-releases", ensureLoggedIn, async function (req, res, next) {
    try {
      const newReleases = await Discover.getNewReleases();
      return res.json({ newReleases });
    } catch (err) {
      return next(err);
    }
});


// Discover Artists backend routes

router.get("/artists", ensureLoggedIn, async function (req, res, next) {
    
    try {
        const { searchTerm, genre } = req.query;
        const validator = jsonschema.validate(req.query, musicSearchAuthSchema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs); 
        }
    
        const result = await Discover.getArtists(searchTerm, genre);
        return res.json({ result });
    } catch (err) {
        return next(err);
    }
});

router.get("/artists/:id", ensureLoggedIn, async function (req, res, next) {
    
    try {
        const { id } = req.query;
        const artist = await Discover.getArtist(id);

        return res.json({ artist });
    } catch (err) {
        return next(err);
    }
});

router.get("/artists/:id/albums", ensureLoggedIn, async function (req, res, next) {
    
    try {
        const { id } = req.query;
        const albums = await Discover.getArtistAlbums(id);

        return res.json({ albums });
    } catch (err) {
        return next(err);
    }
});

router.get("/artists/:id/top-tracks", ensureLoggedIn, async function (req, res, next) {
    
    try {
        const { id } = req.query;
        const topTracks = await Discover.getArtistTopTracks(id);

        return res.json({ topTracks });
    } catch (err) {
        return next(err);
    }
});


// Discover Albums backend routes

router.get("/albums", ensureLoggedIn, async function (req, res, next) {
    
    try {
        const { searchTerm } = req.query;
        const validator = jsonschema.validate(req.query, musicSearchAuthSchema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs); 
        }
    
        const result = await Discover.getAlbums(searchTerm);
        return res.json({ result });
    } catch (err) {
        return next(err);
    }
});

router.get("/albums/:id", ensureLoggedIn, async function (req, res, next) {
    
    try {
        const { id } = req.query;
        const album = await Discover.getAlbum(id);

        return res.json({ album });
    } catch (err) {
        return next(err);
    }
});


// Discover Songs backend routes

router.get("/songs", ensureLoggedIn, async function (req, res, next) {
    
    try {
        const { searchTerm } = req.query;
        const validator = jsonschema.validate(req.query, musicSearchAuthSchema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs); 
        }
    
        const result = await Discover.getSongs(searchTerm);
        return res.json({ result });
    } catch (err) {
        return next(err);
    }
});

router.get("/tracks", ensureLoggedIn, async function (req, res, next) {
    
    try {
        const { ids } = req.query;
        const result = await Discover.getSeveralTracks(ids);
        return res.json({ result });
    } catch (err) {
        return next(err);
    }
});


module.exports = router;
