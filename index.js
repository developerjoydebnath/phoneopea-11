const express = require('express');
const cors = require('cors');

require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

app.get("/", async (req, res)=> {
    res.send('assignment server is running!')
});

app.listen(port, ()=>{
    console.log('server is running at port :', port); 
});