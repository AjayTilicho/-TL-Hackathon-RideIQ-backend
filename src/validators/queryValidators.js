import { query } from 'express-validator';

export const listBikesQueryRules = [
  query('userId').optional().isMongoId().withMessage('userId must be a valid ObjectId'),
];
