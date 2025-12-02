import jwt from 'jsonwebtoken';
import config from '../config/config';

export default function sign(userId, username){
    return jwt.sign(
        {id: userId, username: username},
        config.jwtSecret,
        {expiresIn: config.jwtExpiration}
    )
}