import { Role } from 'shared';

declare global {
  namespace Express {
    interface User {
      email: string;
      name: string;
      picture: string;
      role?: Role;
    }
  }
}
