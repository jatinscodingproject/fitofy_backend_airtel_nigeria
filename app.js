const express = require('express');
const app = express();
const path = require('path')
require('dotenv').config()
const sequelize = require('./config/db');
const PORT = process.env.PORT


app.set('trust proxy', true);

const callbackRoutes = require('./routes/routes.callback');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', callbackRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

require('./cron/smscron')

connectDB();

app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
});

app.use(express.static("public"));


