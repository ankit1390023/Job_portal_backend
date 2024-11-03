import dotenv from 'dotenv';
import { connectDB } from './db/connection.js'
dotenv.config();
import {app} from './app.js'
connectDB()
    .then(() => {
        app.listen(process.env.PORT || 3000, () => {
            console.log(`Server is running on port ${process.env.PORT || 3000}`)
        })
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    })
