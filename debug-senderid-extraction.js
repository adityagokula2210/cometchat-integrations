/**
 * Debug CometChat webhook senderId extraction
 * Check if the senderId is correctly extracted for active conversation detection
 */

async function debugSenderIdExtraction() {
  console.log('🔍 Debugging CometChat Webhook senderId Extraction\n');
  
  const mockCometChatWebhook = {
    trigger: 'after_message',
    appId: 'test-app',
    data: {
      message: {
        id: 'msg_124',
        text: '1',
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

  // Extract senderId the same way the controller does
  const body = mockCometChatWebhook;
  const messageData = body.data.message || body.data;
  const messageText = messageData.text || messageData.data?.text;
  const senderId = messageData.sender || messageData.data?.entities?.sender?.entity?.uid;
  
  console.log('📋 Extracted values:');
  console.log('  messageText:', messageText);
  console.log('  senderId:', senderId);
  console.log('  messageData.sender:', messageData.sender);
  console.log('  messageData.data?.entities?.sender?.entity?.uid:', messageData.data?.entities?.sender?.entity?.uid);
  
  // Test active conversation check
  const tripettoService = require('./src/services/tripettoService');
  
  // First create an active conversation
  console.log('\n🏥 Creating active conversation...');
  await tripettoService.startWorkflow('user_healthcare_test', null, '/care');
  
  // Check if conversation is detected
  console.log('\n🔍 Checking active conversation:');
  const hasActive = tripettoService.hasActiveConversation('user_healthcare_test');
  console.log('  hasActiveConversation("user_healthcare_test"):', hasActive);
  
  const hasActiveSenderId = tripettoService.hasActiveConversation(senderId);
  console.log('  hasActiveConversation(senderId):', hasActiveSenderId);
  
  // Check condition logic
  const triggerCondition = messageText && (messageText.startsWith('/care') || tripettoService.hasActiveConversation(senderId));
  console.log('\n🎯 Trigger condition result:');
  console.log('  messageText exists:', !!messageText);
  console.log('  starts with /care:', !!messageText?.startsWith('/care'));
  console.log('  has active conversation:', tripettoService.hasActiveConversation(senderId));
  console.log('  FINAL TRIGGER CONDITION:', triggerCondition);
}

debugSenderIdExtraction();