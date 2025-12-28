/**
 * Google Gemini API Key Test Script (using LangChain)
 * 
 * Usage: 
 *   node test-gemini-api.js YOUR_API_KEY
 *   
 * Or set GOOGLE_API_KEY environment variable:
 *   GOOGLE_API_KEY=your_key node test-gemini-api.js
 */

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');

async function testGeminiAPI() {
    // Get API key from command line argument or environment variable
    const apiKey = process.argv[2] || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
        console.error('Error: No API key provided!');
        console.log('\nUsage:');
        console.log('  node test-gemini-api.js YOUR_API_KEY');
        console.log('  or');
        console.log('  GOOGLE_API_KEY=your_key node test-gemini-api.js');
        process.exit(1);
    }

    console.log('Testing Google Gemini API via LangChain...\n');
    console.log('API Key (masked):', apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4));
    console.log('');

    try {
        // Initialize the Gemini model via LangChain (same as your app uses)
        const model = new ChatGoogleGenerativeAI({
            model: 'gemini-2.0-flash-001',
            apiKey: apiKey,
            temperature: 0.7,
            streaming: false,
        });

        console.log('Model: gemini-2.0-flash-001');
        console.log('Sending test prompt: "How many seconds are there in a week?"');
        console.log('');

        // Create proper LangChain messages (this tests the exact format your app uses)
        const messages = [
            new SystemMessage('You are a helpful assistant. Answer concisely.'),
            new HumanMessage('How many seconds are there in a week?')
        ];

        // Invoke the model
        const response = await model.invoke(messages);

        console.log('SUCCESS! API is working correctly.\n');
        console.log('Response:');
        console.log('-'.repeat(50));
        console.log(response.content);
        console.log('-'.repeat(50));
        
        return true;
    } catch (error) {
        console.error('FAILED! API test failed.\n');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid')) {
            console.error('\nThe API key appears to be invalid. Please check your key.');
        } else if (error.message.includes('PERMISSION_DENIED')) {
            console.error('\nPermission denied. Make sure the Gemini API is enabled in Google Cloud Console.');
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
            console.error('\nQuota exceeded. Check your API usage limits.');
        } else if (error.message.includes('Unknown / unsupported author')) {
            console.error('\nMessage format error. This indicates a bug in message handling.');
        }
        
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        
        return false;
    }
}

// Run the test
testGeminiAPI()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(err => {
        console.error('Unexpected error:', err);
        process.exit(1);
    });
