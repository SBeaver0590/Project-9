'use strict';

// add routes 
app.use('/api', routes);

const express = require('express');

// an array used to keep track of user courses as they are created.
const users = [];

// router instance
const router = express.Router();

// retrieves a list of user accounts and returns it as JSON
router.get('/users', (req, res) => {
    res.json(users);
});

// Create a new user
router.post('/users', (req, res) => {
    const user = req.body; //get the user from request body
    users.push(user);  //add the user to the `users` array
    res.status(201).end(); //Set the status to 201 created and end the response
});

module.exports = router;