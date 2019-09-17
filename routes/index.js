'use strict';


const express = require('express');

// an array used to keep track of user courses as they are created.
const users = [];

// router instance
const router = express.Router();

// user authentication
const authenticateUser = require('../auth'); 

const sequelize = require('../models');

// user and course models
const { User, Course } = require('../models');

// password hashing
const bcryptjs = require('bcryptjs');

// USERS ROUTES
  

// retrieves a list of user accounts and returns it as JSON
router.get('/users', authenticateUser, (req, res, next) => {
    try {
      const user = req.currentUser;
      res.status(200).json({
        firstName: user.firstName,
        lastName: user.lastName,
        emailAddress: user.emailAddress
      });
    } catch (error) {
      next(error);
    }           //returns user authenticated
});

// Create a new user set the location header to the "/" and returns no content
router.post('/users', async (req, res, next) => {
    try {
        const user = req.body; //get the user from request body
      if (user && user.password) {
        user.password = bcryptjs.hashSync(user.password);
        await User.create(user);
        res.location('/').status(201).end();
      } else {
        const error = new Error("Invalid user information provided");
        error.status = 400;
        next(error);
      }
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        error.status = 400;
        const errors = error.errors.map(err => err.message);
        error.errors = errors;
        console.error('Validation errors: ', errors)
        next(error);
      } else if (error.name === 'SequelizeUniqueConstraintError'){
        const errors = new Error("Please provide a valid email address");
        error.status = 400;
        next(error);
      } else {
        next(error);
      }
    }
});
// router.post('/users', asyncHandler(async (req, res) => {
//   if(req.body.password) {
//     req.body.password = await bcryptjs.hashSync(req.body.password);
//     const user = await User.create(req.body);
//   } else {
//     const user = await User.create(req.body);
//   }
//     res.location('/');
//     res.status(201).end();
//   })
// );



//COURSES ROUTES
//Retrieves a list of courses and users who own each course
router.get('/courses', async (req, res, next) => {
    try {
      const courses = await Course.findAll({
        include: [ 
          { model: User, 
            attributes: { 
              exclude: [ "password", "createdAt", "updatedAt" ] 
            } 
          } 
        ],
        attributes: { 
          exclude: [ "createdAt", "updatedAt" ] 
        }
        
      });
  
      res.status(200).json(courses);
    } catch (error) {
      next(error);
    }
});


//Returns the course with the user that owns it and the concurring ID
router.get('/courses/:id', async (req, res, next) => {
    try {
      const course = await Course.findByPk(req.params.id, {
        include: [ 
          { model: User, 
            attributes: { 
              exclude: [ "password", "createdAt", "updatedAt" ] 
            } 
          } 
        ],
        attributes: { 
          exclude: [ "createdAt", "updatedAt" ] 
        }
  
      });
      if (course) {
        res.status(200).json(course);
      } else {
        const err = new Error('Course Not Found');
        err.status = 404;
        next(err);
      }
    } catch (error) {
      next(error);
    }
});

//Create a course, set it's location header to the URI of the course and return no content
router.post('/courses', authenticateUser, async (req, res, next) => {
    try {
      const user = req.currentUser;
      let course = req.body;
      course.userId = user.id;
  
      course = await Course.create(course);
      res.status(201).location(`/api/courses/${course.id}`).end();
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        error.status = 400;
        const errors = error.errors.map(err => err.message);
        error.errors = errors;
        console.error('Validation errors: ', errors)
        next(error);
      } else {
        next(error);
      }
    }
});

//Update a course and return no content
router.put('/courses/:id', authenticateUser, async (req, res, next) => {
    try {
      if (!req.body.title || !req.body.description) {
        const error = new Error('Title and body are required.');
        error.status = 400;
        next(error);
      } else {
        const user = req.currentUser;
        const course = await Course.findByPk(req.params.id, {
          include: [ 
            { model: User } 
          ]
        });
  
        if (user.id === course.userId) {
          await course.update(req.body);
          res.status(204).end();
        } else {
          res.status(403).end();
        }
      }
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        error.status = 400;
        const errors = error.errors.map(err => err.message);
        error.errors = errors;
        console.error('Validation errors: ', errors)
        next(error);
      } else {
        next(error);
      }
    }
});

//Delete a course and return no content
router.delete('/courses/:id', authenticateUser, async (req, res, next) => {
    try {
      const user = req.currentUser;
      const courseToDelete = await Course.findByPk(req.params.id);
  
      if (user.id === courseToDelete.userId) {
        await courseToDelete.destroy();
        res.status(204).end();
      } else {
        res.status(403).end();
      }
    } catch (error) {
      next(error);
    }
});

module.exports = router;