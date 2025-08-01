import dotenv from 'dotenv'
import {app} from './app.js'
import {connectDB} from './db/index.js'

dotenv.config(
    {
        path : './.env'
    }
);

connectDB()
        .then(() => {
            app.listen(process.env.PORT || 5000 , () => {
                console.log(`🚀 Server is running on port ${process.env.PORT || 5000}`);
            }) 
        })
        .catch( (error) => {
            console.error("Error connecting to the database:", error);
            process.exit(1);
        })