import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export default function sign(userId, username, expiresIn = config.jwtExpiration){
    
    return jwt.sign(
        {id: userId, username: username},
        config.jwtSecret,
        {expiresIn}
    )
}