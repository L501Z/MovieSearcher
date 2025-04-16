import express from 'express';

import router from './API/routes/databaseRoutes.mjs';

import bodyParser from 'body-parser';

import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = "C:\\Users\\gfuhygo\\teamProject\\"

app.use(bodyParser.json() );     
app.use(bodyParser.urlencoded({ extended: true })); 

app.use("/api/v2", router);

app.get("/", (req,res,next)=>{
  res.status(200).sendFile(__dirname+"\\application\\src\\public\\index.html")
})

app.listen(PORT, () => {
  console.log(`API is listening on port ${PORT}`);
});