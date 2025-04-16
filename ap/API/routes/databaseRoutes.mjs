import express from 'express'
import * as controller from '../controllers/databaseAll.mjs'
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
const router = express.Router()

function isAlphaNumeric(char) {
    return (/[a-zA-Z0-9_]/).test(char)
  }

const checkToken = (req,res,next) => {
    try{
        //define and check access key against all api routes
        const accessKey = "hello";
        if (!req.headers || req.headers === undefined){
            res.status(400).send(`<h2>Headers are empty, is the request formatted correctly?><h2>`);
        }
        else if (!req.headers.authorization || req.headers.authorization === null){
            res.status(401).send(`<h2>There is no authorisation header, use 'Authorization'<h2>`)
        }
        else if (req.headers.authorization !== accessKey){
            res.status(401).send(`<h2>Incorrect Access Key<h2>`)
        }
        else{
            next();
        }
    }
    catch(err){
        res.status(500).send(`<h2>Something went wrong here: ${err}<h2>`)
    }
}

const queryValidationDb = (req,res,next) => {
    //for each query parameter
    const noOfHeaders = Object.keys(req.query).length;

    if (noOfHeaders === 0 || noOfHeaders === undefined){
        res.status(400).send("You dont have a query parameter");
    }
    else{
        try{
            if (req.query.dbName === undefined || !req.query.dbName){
                res.status(400).send("No db name use 'dbName' as query parameter")
            }      
            else if(req.query.dbName.length <= 0 || req.query.dbName.length > 30){
                res.status(400).send("Incorrect query");
            }
            else if (req.query.dbName === "sys"){
                res.status(401).send("Unauthorized");
            }
            else{
                //turns query into array and runs 'isAlphaNumeric' on each char
                req.query.dbName.split("").map((char)=>{if (isAlphaNumeric(char) === false){
                    res.status(400).send("Please use the correct name");
                }}) 

                if (req.query.dbName.length >= 1 || req.query.dbNamelength <= 30){
                    next();
                }
                else{
                    res.status(500).send("Lost variable memory")
                }

            }
        }
        catch(err){
            console.log(err)
        }
    }
}

const paramValidationDb = (req,res,next) => {  
    //for each query parameter#
    try{
        if (req.params.db === undefined || !req.params.db){
            res.status(400).send("No col name use 'collection' as query parameter")
        }      
        else if(req.params.db.length <= 0 || req.params.db.length > 30){

            res.status(400).send("Incorrect endpoint");
        }
        else if (req.params.db === "sys"){
            res.status(401).send("Unauthorized");
        }
        else{
            //turns query into array and runs 'isAlphaNumeric' on each char
            req.params.db.split("").map((char)=>{if (isAlphaNumeric(char) === false){
                res.status(400).send("Please use the correct name");
            }}) 

            if (req.params.db.length >= 1 || req.params.db.length <= 30){
                next();
            }
            else{
                res.status(500).send("Lost variable memory")
            }

        }
    }
    catch(err){
        console.log(err)
    }

}

const paramValidationCol = (req,res,next) => {  
    //for each query parameter#
    try{
        if (req.params.collection === undefined || !req.params.collection){
            res.status(400).send("No col name use 'collection' as query parameter")
        }      
        else if(req.params.collection.length <= 0 || req.params.collection.length > 30){

            res.status(400).send("Incorrect endpoint");
        }
        else if (req.params.collection === "sys"){
            res.status(401).send("Unauthorized");
        }
        else{
            //turns query into array and runs 'isAlphaNumeric' on each char
            req.params.collection.split("").map((char)=>{if (isAlphaNumeric(char) === false){
                res.status(400).send("Please use the correct name");
            }}) 

            if (req.params.collection.length >= 1 || req.params.collection.length <= 30){
                next();
            }
            else{
                res.status(500).send("Lost variable memory")
            }

        }
    }
    catch(err){
        console.log(err)
    }

}

const paramValidationField = (req,res,next) => {
    //for each query parameter
    try{
        if (req.params.field === undefined || !req.params.field){
            res.status(400).send("No field name use 'field' as endpoint parameter")
        }      
        else if(req.params.field.length <= 0 || req.params.field.length > 10){
            res.status(400).send("Incorrect endpoint");
        }
        else{
            //turns query into array and runs 'isAlphaNumeric' on each char
            req.params.field.split("").map((char)=>{if (isAlphaNumeric(char) === false){
                res.status(400).send("Please use the correct name");
            }}) 

            if (req.params.field.length >= 1 || req.params.field.length <= 10){
                next();
            }
            else{
                res.status(500).send("Lost variable memory")
            }

        }
    }
    catch(err){
        console.log(err)
    }

}

const queryValidationSearch = (req,res,next) => {
    //for each query parameter
    const noOfHeaders = Object.keys(req.query).length;
    if (noOfHeaders === 0 || noOfHeaders === undefined){
        res.status(400).send("You dont have a query parameter");
    }
    else{
        try{
            if (req.query.search === undefined || !req.query.search){
                res.status(400).send("No search parameter use '?search=<your_search>' as query parameter")
            }      
            else if(req.query.search.length <= 0 || req.query.search.length > 40){
                res.status(400).send("Incorrect query");
            }
            else{
                //turns query into array and runs 'isAlphaNumeric' on each char
                req.query.search.split("").map((char)=>{if (isAlphaNumeric(char) === false){
                    res.status(400).send("Please use the correct name");
                }}) 

                if (req.query.search.length >= 1 || req.query.search.length <= 30){
                    next();
                }
                else{
                    res.status(500).send("Lost variable memory")
                }

            }
        }
        catch(err){
            console.log(err)
        }
    }
}


router.get("/" ,controller.home)

router.get("/dbsizes" ,controller.databaseSize)

router.get("/dbsearch",queryValidationSearch,controller.dbSearch)

router.get("/:db/:collection", paramValidationCol ,controller.getCollectionDocs)

router.get("/getCollectionNames", queryValidationDb,controller.getCollectionNames)

router.get("/allFields" ,controller.getFieldNames)

router.get("/:db/:collection/:field", paramValidationDb ,paramValidationCol, paramValidationField ,controller.getAllField)

router.get("/image", queryValidationSearch , controller.getImage)






export default router;