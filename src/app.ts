import createError, {HttpError} from 'http-errors';
import express, {Request, Response, NextFunction} from 'express';
import mainRouter from './routes/main.js';

let app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use('/', mainRouter);

//catch 404 and forward to error handler
app.use(function (req: Request, res: Response, next: NextFunction) {
    next(createError(404));
});

//error handler
// noinspection JSUnusedLocalSymbols
app.use(function (err: HttpError, req: Request, res: Response, next: NextFunction) {
    console.log(err);
    // render the error page
    res.status(err.status || 500);
    let result = {
        error: {
            message: err.message,
            status: err.status || 500,
        },
    };
    res.json(result);
});


export default app;
