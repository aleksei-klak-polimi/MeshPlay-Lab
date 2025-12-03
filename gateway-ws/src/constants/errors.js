import codes from "../protocol/status/codes.js";

export class AppError{
    constructor(code = codes.GENERIC_ERROR, message = null){
        this.code = code;
        this.message = message;
        this.isAppError = true;
        this.name = 'AppError';
    }
}

export class InvalidMessageFormat extends AppError{
    constructor(message = 'Request is formatted incorrectly.'){
        super(codes.INVALID_INPUT, message);
        this.name = 'InvalidRequestFormat';
    }
}

export class InvalidTarget extends AppError{
    constructor(message = 'Target not found.'){
        super(codes.INVALID_TARGET, message);
        this.name = 'InvalidTarget';
    }
}

export class InternalError extends AppError{
    constructor(message = 'Could not fulfill request due to an unexpected server error.'){
        super(codes.INTERNAL_ERROR, message);
        this.name = 'InternalError';
    }
}