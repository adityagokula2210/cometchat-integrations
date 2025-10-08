/**
 * Test CometChat-Tripetto Integration
 * Simulates CometChat webhook with Tripetto trigger
 */

const CometChatController = require('./src/controllers/cometChatController');

// Mock response object
const mockResponse = {
  status: (code) => ({ json: (data) => console.log(`Response ${code}:`, data) }),
  json: (data) => console.log('Response:', data)
};

// Simulate CometChat webhook payload for /care command
const mockCometChatWebhook = {
  trigger: 'after_message',
  appId: 'test-app',
  data: {
    message: {
      id: 'msg_123',
      text: '/care',
      sender: 'user_healthcare_test',
      receiverType: 'user',
      receiver: 'cometchat_bot',
      sentAt: Math.floor(Date.now() / 1000),
      data: {
        entities: {
          sender: {
            entity: {
              uid: 'user_healthcare_test',
              name: 'Healthcare Test User',
              avatar: 'https://example.com/avatar.jpg'
            }
          }
        }
      }
    }
  }
};

// Simulate follow-up response
const mockFollowUpWebhook = {
  ...mockCometChatWebhook,
  data: {
    ...mockCometChatWebhook.data,
    message: {
      ...mockCometChatWebhook.data.message,
      id: 'msg_124',
      text: '1',
      sentAt: Math.floor(Date.now() / 1000) + 5
    }
  }
};

async function testTripettoCometChatIntegration() {
  console.log('🧪 Testing CometChat-Tripetto Integration\n');
  
  try {
    console.log('📨 Step 1: Simulating CometChat webhook with /care command...');
    const req1 = { body: mockCometChatWebhook };
    await CometChatController.handleWebhook(req1, mockResponse);
    
    console.log('\n⏱️  Waiting 2 seconds before follow-up...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📨 Step 2: Simulating follow-up response "1" (Schedule Appointment)...');
    const req2 = { body: mockFollowUpWebhook };
    await CometChatController.handleWebhook(req2, mockResponse);
    
    console.log('\n✅ CometChat-Tripetto integration test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTripettoCometChatIntegration();