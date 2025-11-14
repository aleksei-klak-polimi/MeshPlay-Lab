import Joi from "joi";
import { id } from "./fields.js";

export const getUserSchema = Joi.object({
    id: id.required()
            .messages({'string.empty': 'User id is required'}),
});

