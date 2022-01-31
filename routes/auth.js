"use strict";

/** Routes for authentication. */
const jwt = require("jsonwebtoken");
const jsonschema = require("jsonschema");
const User = require("../models/user");
const express = require("express");
const router = new express.Router();
const { createToken } = require("../helpers/tokens");
const userAuthSchema = require("../schemas/userAuth.json");
const userRegisterSchema = require("../schemas/userRegister.json");
const { BadRequestError } = require("../expressError");
const {SECRET_KEY} = require("../config");

/** POST /auth/token:  { username, password } => { token }
 *
 * Returns object including access_token and currUser, which can be used 
 * to authenticate further requests to the API.
 *
 * Authorization required: none
 */ 

router.post("/token", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userAuthSchema);

    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs); 
    }

    const { username, password } = req.body;
    const user = await User.authenticate(username, password);

    if(user) {
        const token = await createToken(user);
      
        return res.json({ token });
    } else {
        console.error("User not found");
    }
  } catch (err) {
    return next(err);
  }
});


/** POST /auth/register:   { user } => { token }
 *
 * user must include { username, password, firstName, lastName, email }
 *
 * Returns obj including access_token and currUser which can be used to 
 * authenticate further requests to the API.
 *
 * Authorization required: none
 */

router.post("/register", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userRegisterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const newUser = await User.register({ ...req.body });
    const token = await createToken(newUser);
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
