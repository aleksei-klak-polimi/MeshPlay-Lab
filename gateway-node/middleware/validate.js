export function validateBody(schema) {
    return (req, res, next) => {
        const {error} = schema.validate(req.body, {abortEarly: false});

        if(error) {
            return res.status(400).json({
                errors: error.details.map((err) => err.message)
            });
        }

        next();
    };
}

export function validateParams(schema) {
    return (req, res, next) => {
        const {error} = schema.validate(req.params, {abortEarly: false});

        if(error) {
            return res.status(400).json({
                errors: error.details.map((err) => err.message)
            });
        }

        next();
    };
}

export function validateQuery(schema) {
    return (req, res, next) => {
        const {error} = schema.validate(req.query, {abortEarly: false});

        if(error) {
            return res.status(400).json({
                errors: error.details.map((err) => err.message)
            });
        }

        next();
    };
}