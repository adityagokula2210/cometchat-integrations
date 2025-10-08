/**
 * Debug Tripetto Active Conversation Detection
 * Test why follow-up messages aren't detected as active conversations
 */

const tripettoService = require('./src/services/tripettoService');
const conversationStateService = require('./src/services/conversationStateService');

async function debugConversationDetection() {
  console.log('🔍 Debugging Tripetto Active Conversation Detection\n');
  
  try {
    // Step 1: Start a workflow to create an active conversation
    console.log('📝 Step 1: Starting workflow for user...');
    const userId = 'debug_user_123';
    const startResponse = await tripettoService.startWorkflow(userId, 'chronious-care');
    console.log('Start response:', {
      type: startResponse.type,
      messageLength: startResponse.message?.length || 0,
      hasOptions: !!startResponse.options?.length
    });
    
    // Step 2: Check if conversation is detected as active
    console.log('\n🔍 Step 2: Checking active conversation detection...');
    const hasActive1 = tripettoService.hasActiveConversation(userId);
    console.log('Has active conversation (from service):', hasActive1);
    
    const conversation = conversationStateService.getConversation(userId);
    console.log('Direct conversation check:', {
      exists: !!conversation,
      isActive: conversation?.isActive,
      complete: conversation?.complete,
      userId: conversation?.userId
    });
    
    // Step 3: Test follow-up message processing
    console.log('\n💬 Step 3: Processing follow-up response...');
    const hasActive2 = tripettoService.hasActiveConversation(userId);
    console.log('Has active conversation before response:', hasActive2);
    
    if (hasActive2) {
      const followUpResponse = await tripettoService.processUserResponse(userId, '1');
      console.log('Follow-up response:', {
        type: followUpResponse.type,
        messageLength: followUpResponse.message?.length || 0,
        complete: followUpResponse.complete
      });
    } else {
      console.log('❌ No active conversation detected for follow-up');
    }
    
    // Step 4: Check final state
    console.log('\n📊 Step 4: Final statistics...');
    const stats = tripettoService.getStatistics();
    console.log('Service statistics:', stats);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
  }
}

// Run the debug
debugConversationDetection();