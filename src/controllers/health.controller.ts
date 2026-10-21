import type { Request, Response } from 'express';

export const getHealth = (req: Request, res: Response): void => {
  res.status(200).json({
    status: 'success',
    message: 'DevPrep API is running smoothly.',
    timeStamp: new Date().toISOString(),
  });
};
