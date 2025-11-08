import { HttpInterceptorFn } from '@angular/common/http';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('Interceptor activo: agregando token de autorización a la solicitud.');
  const cloneReq = req.clone({
    setHeaders: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsInVzZXJuYW1lIjoiS2V2aW4gRnJhbmNvIiwiZW1haWwiOiJLZXZpbkBlbWFpbC5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTc2MjQ1MTk5NywiZXhwIjoxNzYyNDU5MTk3fQ.YY5JKlagUSQy1VcLhBd55hy3_pKsnpqxj9Rb27PUm6E',
    },
  });

  return next(cloneReq);
};
