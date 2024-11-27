import express, { application, urlencoded } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// Middlewares
app.use(cors({
    origin: 'http://localhost:5173', // Allow requests from your frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
    credentials: true // Include cookies if necessary
}));
app.use(express.json({ limit: "16kb" }));
app.use(urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Import routes
import userRouter from './routes/user.route.js';
import companyRouter from './routes/company.route.js';
import jobRouter from './routes/job.route.js';
import applicationRouter from './routes/application.route.js';
// Route declarations
app.use('/api/v1/user', userRouter);
app.use('/api/v1/company', companyRouter);
app.use('/api/v1/job', jobRouter); 
app.use('/api/v1/application', applicationRouter);
export { app };
