const auth = require('basic-auth');
const bcryptjs = require('bcryptjs');
const { User } = require('./models');

const authenticateUser = async (req, res, next) => { // parse the user credentials 
    try{

        let message = null; 
        const credentials = auth(req);
        if (credentials) { // if credentials are available get user by user name
            const user = await User.findOne({ where: {emailAddress: `${credentials.name}`} });
            if (user) { // if successful compare  the user password to password retrieved
                const authenticated = bcryptjs
                .compareSync(credentials.pass, user.password);
                if (authenticated) { //if matches store data and use middleware
                    console.log(`Authentication successful for username: ${user.firstName}`);
                    const userDetails = user.toJSON();
                    const { id , firstName, lastName, emailAddress} = userDetails;
                    req.currentUser = {
                        id,
                        firstName,
                        lastName,
                        emailAddress,
                    };
                } else {
                    message = `Authentication failure for username: ${user.emailAddress}`;                
                }
            } else {
                message = `User not found for username: ${credentials.name}`;            
            }
        } else {
            message = 'Auth header not found';        
        }
        if (message) { //if authentications failed show error 401
            console.warn(message);
            res.status(401).json({ message: 'Access Denied, you need to be logged in' });        
        } else {
            next();
        }
        
    }catch(err){
};

};

const  asyncHandler = (cb) => {
    return async (req,res,next)=> {
      try {
        await cb(req,res,next);
      } catch(err){
        res.render('error', {error:err});
      }
    }
}


module.exports = authenticateUser;