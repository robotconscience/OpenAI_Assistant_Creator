// assumes OPENAI_API_KEY env variable set
import OpenAI from "openai";
import fs from 'fs';

const openai = new OpenAI();
let bVerbose = true; //set false to stop all the logs

/******************************** 
    SETUP
********************************/

// location of 'about' file
const aboutFile = "about.json";

// try to load about.json
let loadedFile = null;
if (!fs.existsSync(aboutFile)) {
    console.error("You're mssing an about file " + aboutFile);
    exit();
}
try {
    loadedFile = fs.readFileSync(aboutFile, 'utf8');
} catch (error) {
    console.error("Error loading about file. Aborting.");
    console.error(error);
    exit();
}

// OK, we have a file. Parse it.
let aboutJSON = null;
try {
    aboutJSON = JSON.parse(loadedFile);
} catch (error) {
    console.error("Error parsing JSON. Bye.");
    console.error(error);
    exit();
}

// file containing uploaded files, if you did that already
const cacheFilesFile = "files.json";
const bIgnoreCacheFile = false; // force upload, if U want

// load files from data directory
let bHaveFiles = false;
const knowledgeDir = "knowledge";
let directoryFiles = null;
let fileIndex = 0;

if (fs.existsSync(knowledgeDir)) {
    bHaveFiles = true;
    directoryFiles = fs.readdirSync(knowledgeDir);
    if (bVerbose) console.log("Knowledge directory found");
}

/******************************** 
    UPLOAD KNOWLEDGE
********************************/

let openAIFiles = []; // array of files we'll attach to our assistant

async function uploadFileAndIncrement(callback) {
    // first, see if we have already saved a file down
    let bFileCacheExists = false;
    if (fs.existsSync(cacheFilesFile) && !bIgnoreCacheFile){
        bFileCacheExists = true;
        try {
            openAIFiles = JSON.parse(fs.readFileSync(cacheFilesFile));
            if (bVerbose) console.log("Loaded files from cache, making assisstant");
            callback();
            return;
        } catch (error) {
            console.warn("Error loading, moving ahead");
        }
    }

    const file = await openai.files.create({
        file: fs.createReadStream(knowledgeDir + "/" + directoryFiles[fileIndex]),
        purpose: "assistants",
    });
    
    openAIFiles.push(file);
    fileIndex++;
    if (fileIndex >= directoryFiles.length ){
        // save files
        let outData = JSON.stringify(openAIFiles);
        fs.writeFileSync(cacheFilesFile, outData);

        // callback (ideally, creating json)
        callback();
    } else {
        uploadFileAndIncrement(callback);
    }
}

/******************************** 
    MAIN LOOP / CREATE ASST.
********************************/

async function main() {
    // srart file upload
    fileIndex = 0;
    uploadFileAndIncrement(createAssistant);
}

async function createAssistant(){
    let file_ids = [];
    openAIFiles.forEach(file => {
        file_ids.push(file.id);
    });

    const outputFileName = aboutJSON.name +".json";

    // did you already make this assistant, maybe?
    if (fs.existsSync(outputFileName)){
        console.warn("This assistant sees to already exist on disk. Check it out. Delete this file and re-run, if you want to make a new assistant");
        const loadedAssistant = fs.readFileSync(outputFileName);
        try {
            console.log(JSON.parse(loadedAssistant));
        } catch (error) {
            console.warn("Assistant isn't valid JSON.");
        }
        return;
    }

    // OK all good, let's make this thing
    // Also if your about.json is effed, this will be very boring
    const myAssistant = await openai.beta.assistants.create({
        instructions: aboutJSON.instructions || "",
        name: aboutJSON.name || "Unnamed agent",
        tools: aboutJSON.tools || [{ "type": "retrieval" }],
        model: aboutJSON.model || "gpt-4-1106-preview",
        file_ids: file_ids,
    });

    if (bVerbose) console.log(myAssistant);
    
    // save assistant data
    let outData = JSON.stringify(myAssistant);
    fs.writeFileSync(outputFileName, outData);
}

main();