import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('paso por interceptor');

  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({
      setHeaders: { 'Content-type': 'application/json', Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
/* export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('paso por el interceptor');

  const cloneReq = req.clone({
    setHeaders: {
      'Content-type': 'application/json',
      Authorization: localStorage.getItem('token') || '',
    },
  });
  return next(cloneReq);
}; */
