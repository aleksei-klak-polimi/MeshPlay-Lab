import { validateJWT } from '@meshplaylab/shared/src/utils/validateJWT.js';

export async function authenticateConnection(message, socket, next) {
    // Avoids race conditions between events if validateJWT takes too long.
    // If pendingAuth is false or is not a property (default),
    // then the auth handler starts the auth process and sets it to true.
    // If pendingAuth is true then other requests by the client before auth is done will be ignored.
    if (socket.pendingAuth) {
        console.log('Ignoring message: authentication pending.');
        return;
    }
    else if (socket.user) {
        console.log('Ignoring message: user JWT already authenticated.');
        return;
    }
    else
        socket.pendingAuth = true;

    // First message expected is the JWT for authentication, if no valid JWT is provided
    // then return error and close the connection, otherwise switch to the authenticated function.
    let msg;
    try {
        msg = JSON.parse(message);
    } catch (err) {
        console.log('Invalid JSON format');
        socket.terminate();
        return;
    }

    const token = msg.token;
    if (!token) {
        console.log('Missing JWT.');
        socket.terminate();
        return;
    }

    let decoded;
    try {

        decoded = await validateJWT(token);
        console.log('Authentication successful');

    } catch (err) {

        console.log('Invalid JWT.');
        socket.terminate();
        return;

    }

    socket.user = { id: decoded.id, username: decoded.username };
    delete socket.pendingAuth;
    
    next();
}