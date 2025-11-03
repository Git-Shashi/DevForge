import { Middleware } from '@reduxjs/toolkit';

export const loggerMiddleware: Middleware = (store) => (next) => (action) => {
  if (process.env.NODE_ENV === 'development') {
    const typedAction = action as { type: string };
    console.group(typedAction.type);
    console.info('Dispatching:', action);
    
    const result = next(action);
    
    console.log('Next state:', store.getState());
    console.groupEnd();
    
    return result;
  }

  return next(action);
};
