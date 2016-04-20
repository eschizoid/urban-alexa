##UrbanDictionary-AWS Lambda function for Alexa

### Setup
To run this example skill you need to do two things. The first is to deploy the example code in lambda, and the second is to configure the Alexa skill to use Lambda.

### AWS Lambda Setup
1. Go to the AWS Console and click on the Lambda link. Note: ensure you are in us-east or you won't be able to use Alexa with Lambda.
2. Click on the Create a Lambda Function or Get Started Now button.
3. Skip the blueprint
4. Name the Lambda Function "UrbanAlexa".
5. Select the runtime as Node.js
6. Go to the the root directory directory, execute `./gradlew clean buildAlexaSkillZip`.
7. Select the zip file inside the location `./build/distribution/urban-alexa-0.0.1.zip`.
8. Select Code entry type as "Upload a .ZIP file" and then upload the .zip file to the Lambda
9. Keep the Handler as index.handler (this refers to the main js file in the zip).
10. Create a basic execution role and click create.
11. Leave the Advanced settings as the defaults.
12. Click "Next" and review the settings then click "Create Function"
13. Click the "Event Sources" tab and select "Add event source"
14. Set the Event Source type as Alexa Skills kit and Enable it now. Click Submit.
15. Copy the ARN from the top right to be used later in the Alexa Skill Setup

### Alexa Skill Setup
1. Go to the [Alexa Console](https://developer.amazon.com/edw/home.html) and click Add a New Skill.
2. Set "UrbanAlexa" as the skill name and "urban dictionary" as the invocation name, this is what is used to activate your skill. For example you would say: "Alexa, ask Urban Dictionary what is the meaning of Boston Pancake?"
3. Select the Lambda ARN for the skill Endpoint and paste the ARN copied from above. Click Next.
4. Copy the custom slot types from the customSlotTypes folder. Each file in the folder represents a new custom slot type. The name of the file is the name of the custom slot type, and the values in the file are the values for the custom slot.
5. Copy the Intent Schema from the included IntentSchema.json.
6. Copy the Sample Utterances from the included SampleUtterances.txt. Click Next.
7. [optional] go back to the skill Information tab and copy the appId. Paste the appId into the index.js file for the variable APP_ID,
   then update the lambda source zip file with this change and upload to lambda again, this step makes sure the lambda function only serves request from authorized source.
8. You are now able to start testing your sample skill! You should be able to go to the [Echo webpage](http://echo.amazon.com/#skills) and see your skill enabled.
9. In order to test it, try to say some of the Sample Utterances from the Examples section below.
10. Your skill is now saved and once you are finished testing you can continue to publish your skill.

### Examples:
#### One-shot model:
    User: "Alexa, ask Urban Dictionary what's the meaning of cleveland steamer?"
    Alexa: "(queries Urban Dictionary REST api and finds the term)"

