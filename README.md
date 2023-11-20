# Simple Assistant creator
I mostly made this to learn the API, but sharing in case others find it useful

## Setup
1. Setup your OpenAI API account, give it $$$, and set your ```OPENAI_API_KEY``` env variable
2. Customize the ```about-template.json``` with parameters, and save as ```about.json```
3. Create a "knowledge" folder, and load it up with valid files for the API
4. Run ```npm install``` in this directory
5. Run ```node create_assistant.js```
6. Check in your API account: you should have a very cool assistant. You'll also have an ```ASSISTANT NAME.json``` file locally, which gives you the ID etc for future use. ✌️