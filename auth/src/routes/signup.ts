import express, { NextFunction, Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';

import { User } from '../models/User';
import { BadRequestError } from '../errors/BadRequestError';
import { validateRequest } from '../middlewares/ValidateRequest';

const router = express.Router();

router.post(
	'/api/users/signup',
	body('email').isEmail().withMessage('Email must be valid'),
	body('password')
		.trim()
		.isLength({ min: 4, max: 20 })
		.withMessage('Password must be between 4 and 20 characters.'),
	validateRequest,
	async (req: Request, res: Response, next: NextFunction) => {
		const { email, password } = req.body;

		const existingUser = await User.findOne({ email });

		if (existingUser) {
			throw new BadRequestError('Email address is already in use.');
		}

		const user = User.build({ email, password });
		await user.save();

		// Generate JWT
		const userJWT = jwt.sign(
			{
				id: user.id,
				email: user.email,
			},
			process.env.JWT_KEY!
		);

		// Store it on the session object
		req.session = {
			jwt: userJWT,
		};

		res.status(201).send(user);
	}
);

export { router as signUpRouter };
