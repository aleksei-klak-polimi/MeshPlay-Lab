import Joi from "joi";

import { username, password } from "./fields.js";

export const signupSchema = Joi.object({
    username:   username.required()
                            .messages({'string.empty': 'Username is required'}),

    password:   password.required()
                            .messages({'string.empty': 'Password is required'})
});

export const loginSchema = Joi.object({
    username:   username.required()
                            .messages({'string.empty': 'Username is required'}),

    password:   password.required()
                            .messages({'string.empty': 'Password is required'})
});