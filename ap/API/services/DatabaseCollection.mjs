//imports 

import { MongoClient } from "mongodb";

import dotenv from 'dotenv';

dotenv.config();

//define vars 

const connectionString = "mongodb+srv://Moderator:sg192-3SAdy-8789u-O325@cluster0.g903k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

const client = new MongoClient(connectionString);

const listDatabases = await client.db("admin").command({ listDatabases : 1 });

const listDatabasesNames = JSON.parse(JSON.stringify(listDatabases)).databases;

let databaseSizes = new Array();



// Documents<Map> - Key: DbName<String>, Value: Map - Key: CollectionName<String>, Value: Documents<Document>
let documents = new Map();

let tempArray = new Array();

let tempFieldArray = new Array();

let fieldMap = new Map();

let databaseNames = new Array(); //640 as in maximum of 10 names 

let collectionNames = new Array(); //640 as in maximum of 10 names 

let totalFieldValues = new Map();

let collectionFields = new Map(); //maps each collectionname to an array with its field

let allFields = new Array(); //defines the map and all fields

let pixelArrays = new Map(); //pixel arrays stored within each map

// documentValues<Map> - Key: DbName<String>, Value: Map - Key: CollectionName<String>, Value: Map - Key: FieldName<String>, Value: field values <Array>
let documentValues = new Map(); //for each collection holds an un-sorted array of all document values

//create a client that gets closed after data is fetched

/**
 *   Define collection maps and arrays 
 * 
 *      - Database Array <String>
 *      - Database / Collection Map Key: 'DatabaseNames<String>':'Collection<Array>'
 *      
 *   Defines the result for most endpoints except where the increase to application loading would negate the effect of response time
 *   
 *   Static Endpoints are defined as well as some documents used when the user searches within the database 
 * 
 */

//Define Db Array
//Define Collection Map

/**
 * returns an array buffer of database names
 */
const defineDatabases = async() => {

    try{
        for (let i = 0; i <= listDatabasesNames.length -1 ; i++ ){

            let tempName = listDatabasesNames[i].name;

            //starts a sequence which creates a mp and loads documents into arrays
            await addCollectionsToMap(tempName);

            let databaseSize = await setDatabaseSizes(listDatabasesNames[i].name, listDatabasesNames[i].sizeOnDisk);
            if (databaseSize !== undefined){
                databaseSizes.push(databaseSize);
            } //db sizes endpoint for each db get stats on sizes

            databaseNames = getDatabaseNames(); // add to databasename array
            collectionNames = collectionNames.concat(getCollectionNames(listDatabasesNames[i].name)); //combines all collections names into one by calling the get collection names func with db name and concat arrays
            
            
            collectionFields = new Array();
        }

        
       
        setPixelArrays();
        setAllFieldNames();
        console.log("Documents Loaded and Api is ready for requests")
    } //for database names
    catch(err){
        console.log(err)
    }
}
export{defineDatabases}

/**
 * Adds collections to database map 
 * 
 * @param {*} databaseName 
 */
const addCollectionsToMap = async(databaseName) => {
    try{

        const forbiddenNames = ["sys","admin","local"];
        const collectionNameResult = await client.db(databaseName).listCollections({},{nameOnly:true}).toArray()
        if (!collectionNameResult[0] || forbiddenNames.includes(databaseName)){
            return;
        }
        else{
            let collectionDocsMap = new Map();
            for (let i = 0; i <= collectionNameResult.length-1; i++){      
                await loadCollectionDocuments(databaseName, collectionNameResult[i].name)

                collectionDocsMap[collectionNameResult[i].name] = tempArray;
                
                fieldMap[collectionNameResult[i].name] = tempFieldArray;
                tempArray = new Array();
                tempFieldArray = new Array();
            }
            documents[databaseName] = collectionDocsMap;

        }

        //adds each value from the document to document values map
    }
    catch (err){
        console.log(err)
    }
}

/**
 * loads collection documents into maps for searching
 * 
 * @param {string} databaseName 
 * @param {string} collectionName 
 */
const loadCollectionDocuments = async(databaseName, collectionName) => {
    try{
        const docs = await client.db(databaseName).collection(collectionName).find({}).toArray();

  
        const docs1 = docs[0] || {"Empty":"Value"}

        if (docs1 === null){
            tempFieldArray.push("Empty") //pushes keys of first result to get fields in array
            tempArray.push(docs);         
        }
        else{
            const fields = Object.keys(docs1);

            tempFieldArray.push(fields); //pushes keys of first result to get fields in array
            tempArray.push(docs);
            let fieldMap = new Map();
            for (let field in fields){
                if (fields[field] === "Empty"){
                    continue;
                }
                let fieldName = fields[field]
                if (fieldName === "_id"){
                    continue;
                }
                const docs = await client.db(databaseName).collection(collectionName).find({}, { projection: {[fieldName]: 1, _id:0} }).toArray();
                let fieldArray = new Array();
         
                for (let doc in docs){
                    fieldArray.push(docs[doc][fieldName])
                    fieldMap[fieldName] = fieldArray
                    
                }
                collectionFields[collectionName] = fieldMap;
  
                totalFieldValues[databaseName] = collectionFields;
            }    
            
        }

        

        return;
    }
    catch (err){
        console.log(err)
    }
}

/**
 * gets collection from given database names
 * 
 * @param databaseName
*/ 
const getCollectionNames = (databaseName) => {
    try{
        return JSON.parse(JSON.stringify(Object.keys(documents[databaseName])));
    }
    catch (err){

    }
}

/**
 * get database names
 * @returns 
 */
const getDatabaseNames = () => {
    try{
        return JSON.parse(JSON.stringify(Object.keys(documents))) // creating deep copy of object keys to create an array for database na
    }
    catch (err){

    }
}

const setDatabaseSizes = async(databaseName, sizeOnDisk) => {
    try{
        const forbiddenNames = ["sys","local","admin"];
        const collectionNameResult = await client.db(databaseName).listCollections({},{nameOnly:true}).toArray()
        if (!collectionNameResult[0] || forbiddenNames.includes(databaseName)){
            return;
        }
        let databaseStats = await client.db(databaseName).command({
            dbStats: 1,
        });

        let returnObject = {
            name:databaseName,
            total_size:formatBytes(sizeOnDisk),
            info:{
                AverageObjSize: formatBytes(databaseStats.avgObjSize),
                AmountOfCollections: databaseStats.collections,
                StorageSize: formatBytes(databaseStats.storageSize),
                DataSize:formatBytes(databaseStats.dataSize),
                TotalObjects:databaseStats.objects
            }
        }
        databaseSizes.push(returnObject);

    }
    catch (err){
        console.log(err)
    }
}

const setAllFieldNames = () => {
    try{
        for (let collection in fieldMap){

            allFields.push({
                Collection:collection,
                Fields:fieldMap[collection]
            })
        }
    }
    catch(err){
        console.log(err)
    }

}

const setPixelArrays = () => {
    try{
        for (let image in documents["images"]){
            let colourSequence = documents["images"][image][0].length;
            let currentDoc = documents["images"][image]
            let currentPixelArray = new Array();

            for (let i = 0; i <= colourSequence-1; i++){

                let currentRun = currentDoc[0][i].appearence; //takes appearence of image
                currentRun = currentRun.split("-"); // splits image
                
                let counter = currentRun[1] - currentRun[0]; // calculates current run
                let currentArray = new Array(counter).fill(currentDoc[0][i].hex) // fills array with hex

                currentPixelArray = currentPixelArray.concat(currentArray); // combines array
                pixelArrays[image] = currentPixelArray;
            } // for each image

        } //for images in database

    }
    catch (err){
        console.log(err)
    }
}

const returnDatabaseSizes = () => {
    return databaseSizes;
}
export{returnDatabaseSizes};

const initialiseDatabaseSearch = (searchParams) => {

    const partialExpression = new RegExp('[' + searchParams + ']{3}');


    let results = new Array();
    //check for direct match on database and collections, this can translate to searching for camera modules within the algorithm 
    if (databaseNames.includes(searchParams)){
        results.push({
            Match:"Exact",
            Type:"Database",
            URL:"/api/v2/dbstats",
        })
    }
    else if (collectionNames.includes(searchParams)){
        //find db match and update URL
        results.push({
            Match:"Exact",
            Type:"Collection",
            URL:"api/v2/"+""+"/"+searchParams
        })
    }
    else{
        let searchForColMatch = true;
    }

    //iterate over map and check if values match

    for (let collection in fieldMap){
        //if exact match push object
        if (fieldMap[collection].includes(searchParams)){
            results.push({
                Match:"Exact",
                Type:"Field",
                Search:searchParams,
                Field:searchParams,
                Collection:collection,
                URL:"/api/v2/",
            })
        }
        //else match similar characters
        else {
            const fieldString = fieldMap[collection].toString();
            
            if (partialExpression.test(fieldString)){
                results.push({
                    Match:"Partial",
                    Type:"Field",
                    Search:searchParams,
                    Field:searchParams,
                    Collection:collection,
                    URL:"/api/v2/",
                })
            }
            
            else{
                continue;
            }


        }
    }

    //check for partial match

}
export {initialiseDatabaseSearch}

const getAllDocs = async(databaseName, collectionName) => {
    try{
        return documents[databaseName][collectionName];
    }
    catch(err){
        console.log(err)
    }
}
export{getAllDocs}

const getColNames = (databaseName) => {
    try{
        return Object.keys(documents[databaseName]);
    }
    catch(err){
        console.log(err)
    }
}
export{getColNames}

const getAllFieldNames = () => {
    return allFields;
}
export{getAllFieldNames};

const image = (searchParams) => {
    return pixelArrays[searchParams]
}
export{image}

const returnAllInField = async(databaseName, collectionName, field) => {
    try{
        return totalFieldValues[databaseName][collectionName][field];
    }
    catch (err){}
}
export {returnAllInField}

const validateSearchParams = (searchParams) => {
    return;
}

const formatBytes = (bytes) => {
    let sizes = new Array();
    sizes.push("Bytes");
    sizes.push("Kilobytes");
    sizes.push("Megabytes");
    sizes.push("Gigabytes");
    sizes.push("Terrabytes");


    for (let i = 0; i<= sizes.length-1; i++){
        if ((bytes / 1000) < 1){
            return `${parseFloat(bytes).toFixed(2)} ${sizes[i]}`;
        }
        else{
            
            bytes = bytes / 1000;
        }
    }
}



await defineDatabases()

