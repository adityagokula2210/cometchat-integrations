/**
 * Debug Tripetto Form Lookup
 * Check what's causing the startWorkflow error
 */

const tripettoService = require('./src/services/tripettoService');
const { getFormDefinition, getFormByTrigger, getAvailableTriggers } = require('./src/config/tripettoForms');

async function debugFormLookup() {
  console.log('🔍 Debugging Tripetto Form Lookup\n');
  
  try {
    console.log('📋 Step 1: Checking available triggers...');
    const triggers = getAvailableTriggers();
    console.log('Available triggers:', triggers);
    
    console.log('\n🔍 Step 2: Testing form lookup by trigger...');
    const healthcareForm = getFormByTrigger('/care');
    console.log('Healthcare form:', {
      exists: !!healthcareForm,
      id: healthcareForm?.id,
      name: healthcareForm?.name,
      trigger: healthcareForm?.trigger
    });
    
    console.log('\n📝 Step 3: Testing direct form lookup...');
    const directForm = getFormDefinition('chronious-care');
    console.log('Direct form lookup:', {
      exists: !!directForm,
      id: directForm?.id,
      name: directForm?.name,
      hasSections: !!directForm?.definition?.sections?.length
    });
    
    console.log('\n🧪 Step 4: Testing workflow start with explicit trigger...');
    try {
      const response1 = await tripettoService.startWorkflow('test_user_456', null, '/care');
      console.log('Workflow start response (by trigger):', {
        type: response1.type,
        message: response1.message?.substring(0, 100) + '...',
        hasFormId: !!response1.formId
      });
    } catch (error) {
      console.log('Error starting workflow by trigger:', error.message);
    }
    
    console.log('\n🧪 Step 5: Testing workflow start with form ID...');
    try {
      const response2 = await tripettoService.startWorkflow('test_user_789', 'chronious-care');
      console.log('Workflow start response (by formId):', {
        type: response2.type,
        message: response2.message?.substring(0, 100) + '...',
        hasFormId: !!response2.formId
      });
    } catch (error) {
      console.log('Error starting workflow by formId:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
  }
}

// Run the debug
debugFormLookup();