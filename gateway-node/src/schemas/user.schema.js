import Joi from "joi";
import { id, username } from "./fields.js";

export const getUserSchema = Joi.object({
    id: id.required()
            .messages({'string.empty': 'User id is required'}),
});

export const deleteUserSchema = Joi.object({
    id: id.required()
            .messages({'string.empty': 'User id is required'}),
});

export const editUserParamSchema = Joi.object({
    id: id.required()
            .messages({'string.empty': 'User id is required'}),
});

export const editUserBodySchema = Joi.object({
    username: username
});

