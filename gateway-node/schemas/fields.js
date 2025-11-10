import Joi from "joi"

export const id = Joi.number().integer().positive();

export const username = Joi.string()
                            .pattern(/^[a-zA-Z0-9_]{3,255}$/)
                            .messages({'string.pattern.base' : 'Username must be 3-256 characters, letters and or numbers only'});

export const password = Joi.string()
                            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:'",.<>/?]).{8,256}$/)
                            .messages({'string.pattern.base': 'Password must be at least 8 characters long and include one uppercase letter, one lowercase letter, one number, and one special character'});
