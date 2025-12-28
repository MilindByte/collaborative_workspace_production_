import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role?: string;
  };
  params: any;
  query: any;
  body: any;
}
