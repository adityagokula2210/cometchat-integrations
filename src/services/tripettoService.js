/**
 * Tripetto Service
 * Core service for managing Tripetto form workflows and conversations
 */

const logger = require('../utils/logger');
const conversationStateService = require('./conversationStateService');
const { getFormDefinition, getFormByTrigger, getAvailableTriggers } = require('../config/tripettoForms');

class TripettoService {
  constructor() {
    this.conversationState = conversationStateService;
    
    logger.info('Tripetto Service initialized');
  }

  /**
   * Start a new workflow for a user
   * @param {string} userId - User identifier
   * @param {string} formId - Form identifier (optional)
   * @param {string} trigger - Trigger command (e.g., "/care")
   * @returns {Object} Initial workflow response
   */
  async startWorkflow(userId, formId = null, trigger = null) {
    try {
      // Check if user already has an active conversation
      const existingState = conversationStateService.getConversation(userId);
      if (existingState && existingState.isActive) {
        return {
          type: 'error',
          message: `You already have an active workflow. Type 'cancel' to start a new one.`,
          currentForm: existingState.formId
        };
      }

      // Determine form to use
      let form;
      if (trigger) {
        form = getFormByTrigger(trigger);
        if (!form) {
          return {
            type: 'error',
            message: `Unknown command: ${trigger}`,
            availableCommands: getAvailableTriggers()
          };
        }
      } else if (formId) {
        form = getFormDefinition(formId);
        if (!form) {
          return {
            type: 'error',
            message: `Form not found: ${formId}`
          };
        }
      } else {
        // Default to chronious care form
        form = getFormDefinition('chronious-care');
      }

      if (!form) {
        throw new Error('No valid form found');
      }

      // Start the conversation
      // Start conversation with state management
      const conversationState = await conversationStateService.startConversation(
        userId, 
        form.id, 
        form.definition
      );

      // Get the initial message
      const initialMessage = this.getInitialMessage(form.definition);

      return {
        type: 'question',
        formId: form.id,
        formName: form.name,
        message: initialMessage.text,
        question: initialMessage.question,
        options: initialMessage.options,
        progress: 0
      };

    } catch (error) {
      logger.error('Failed to start Tripetto workflow', {
        userId,
        formId,
        trigger,
        error: error.message
      });
      
      return {
        type: 'error',
        message: 'Sorry, I couldn\'t start the workflow. Please try again later.',
        error: error.message
      };
    }
  }

  /**
   * Process user response and get next workflow step
   * @param {string} userId - User identifier
   * @param {string} userInput - User's response text
   * @returns {Object} Next workflow step or completion
   */
  async processUserResponse(userId, userInput) {
    try {
      const conversationState = await conversationStateService.getUserConversationState(userId);
      
      if (!conversationState || !conversationState.isActive) {
        return {
          type: 'error',
          message: 'No active workflow found. Use `/care` to start the ChroniusCare assistant.'
        };
      }

      // Handle special commands
      if (userInput.toLowerCase().trim() === 'cancel') {
        await conversationStateService.endConversation(userId, 'cancelled');
        return {
          type: 'cancelled',
          message: 'Workflow cancelled. You can start a new one anytime with `/care`.'
        };
      }

      // Process the response based on current state
      const currentQuestion = this.getCurrentQuestion(conversationState);
      if (!currentQuestion) {
        throw new Error('No current question found');
      }

      // Validate and process the response
      const processedResponse = this.processResponse(currentQuestion, userInput);
      if (processedResponse.error) {
        return {
          type: 'validation_error',
          message: processedResponse.error,
          question: currentQuestion
        };
      }

      // Store the response
      const responses = { [currentQuestion.nodeId]: processedResponse.value };
      
      // Determine next step based on branching logic
      const nextStep = this.determineNextStep(conversationState, processedResponse.value);
      
      // Update conversation state
      await conversationStateService.updateConversationProgress(userId, {
        responses: responses,
        currentSectionIndex: nextStep.sectionIndex,
        currentNodeIndex: nextStep.nodeIndex,
        isComplete: nextStep.isComplete
      });

      if (nextStep.isComplete) {
        // Workflow completed
        await conversationStateService.endConversation(userId, 'completed');
        
        return {
          type: 'completion',
          message: nextStep.completionMessage || 'Thank you! Your request has been processed.',
          formId: conversationState.formId,
          responses: conversationState.responses,
          completedAt: new Date()
        };
      } else {
        // Get next question
        const nextQuestion = this.getQuestionAtStep(conversationState.formDefinition, nextStep);
        
        return {
          type: 'question',
          message: nextQuestion.text,
          question: nextQuestion.question,
          options: nextQuestion.options,
          progress: Math.round(((nextStep.sectionIndex + nextStep.nodeIndex + 1) / this.getTotalSteps(conversationState.formDefinition)) * 100)
        };
      }

    } catch (error) {
      logger.error('Failed to process user response', {
        userId,
        userInput,
        error: error.message
      });
      
      return {
        type: 'error',
        message: 'Sorry, something went wrong processing your response. Please try again.',
        error: error.message
      };
    }
  }

  /**
   * Get the initial message from form definition
   * @param {Object} formDefinition - Tripetto form definition
   * @returns {Object} Initial message object
   * @private
   */
  getInitialMessage(formDefinition) {
    try {
      let messageText = '';
      
      // Add prologue if available
      if (formDefinition.prologue && formDefinition.prologue.title) {
        messageText = formDefinition.prologue.title + '\n\n';
      }

      // Get first question
      const firstSection = formDefinition.sections[0];
      const firstNode = firstSection.nodes[0];
      
      messageText += firstNode.name;

      // Extract choices if it's a multiple choice question
      const options = [];
      if (firstNode.block && firstNode.block.type === '@tripetto/block-multiple-choice') {
        for (let i = 0; i < firstNode.block.choices.length; i++) {
          const choice = firstNode.block.choices[i];
          options.push({
            id: choice.id,
            text: `${i + 1}. ${choice.name}`,
            value: choice.name
          });
        }
      }

      return {
        text: messageText,
        question: {
          nodeId: firstNode.id,
          type: firstNode.block?.type || 'text',
          text: firstNode.name
        },
        options: options
      };

    } catch (error) {
      logger.error('Failed to get initial message', { error: error.message });
      return {
        text: 'Hello! How can I help you today?',
        question: { nodeId: 'default', type: 'text', text: 'How can I help you?' },
        options: []
      };
    }
  }

  /**
   * Get current question for conversation state
   * @param {Object} conversationState - Current conversation state
   * @returns {Object} Current question
   * @private
   */
  getCurrentQuestion(conversationState) {
    try {
      const section = conversationState.formDefinition.sections[conversationState.currentSectionIndex];
      const node = section.nodes[conversationState.currentNodeIndex];
      
      return {
        nodeId: node.id,
        type: node.block?.type || 'text',
        text: node.name,
        block: node.block
      };

    } catch (error) {
      logger.error('Failed to get current question', { error: error.message });
      return null;
    }
  }

  /**
   * Process and validate user response
   * @param {Object} question - Current question
   * @param {string} userInput - User's response
   * @returns {Object} Processed response with validation
   * @private
   */
  processResponse(question, userInput) {
    try {
      const input = userInput.trim();

      if (question.type === '@tripetto/block-multiple-choice') {
        // Handle multiple choice responses
        const choices = question.block.choices;
        
        // Try to match by number (1, 2, 3, etc.)
        const choiceNumber = parseInt(input);
        if (choiceNumber >= 1 && choiceNumber <= choices.length) {
          const selectedChoice = choices[choiceNumber - 1];
          return {
            value: selectedChoice.id,
            displayValue: selectedChoice.name
          };
        }
        
        // Try to match by text
        const matchedChoice = choices.find(choice => 
          choice.name.toLowerCase() === input.toLowerCase() ||
          input.toLowerCase().includes(choice.name.toLowerCase().substring(0, 3))
        );
        
        if (matchedChoice) {
          return {
            value: matchedChoice.id,
            displayValue: matchedChoice.name
          };
        }
        
        // No match found
        const optionsList = choices.map((choice, index) => `${index + 1}. ${choice.name}`).join('\n');
        return {
          error: `Please select one of the options:\n${optionsList}`
        };
      }

      // Default text response
      return {
        value: input,
        displayValue: input
      };

    } catch (error) {
      logger.error('Failed to process response', { error: error.message });
      return {
        error: 'Unable to process your response. Please try again.'
      };
    }
  }

  /**
   * Determine next step based on current state and response
   * @param {Object} conversationState - Current conversation state
   * @param {string} responseValue - User's response value
   * @returns {Object} Next step information
   * @private
   */
  determineNextStep(conversationState, responseValue) {
    try {
      const currentSection = conversationState.formDefinition.sections[conversationState.currentSectionIndex];
      
      // Check for branches based on the response
      if (currentSection.branches) {
        for (const branch of currentSection.branches) {
          if (this.evaluateBranchCondition(branch, responseValue)) {
            if (branch.jump === 'abort') {
              return {
                isComplete: true,
                completionMessage: 'Thank you! Your request has been noted.'
              };
            }
            // Handle other branch logic here
          }
        }
      }

      // Default: move to next node or section
      let nextSectionIndex = conversationState.currentSectionIndex;
      let nextNodeIndex = conversationState.currentNodeIndex + 1;

      // Check if we need to move to next section
      if (nextNodeIndex >= currentSection.nodes.length) {
        nextSectionIndex++;
        nextNodeIndex = 0;
      }

      // Check if we've reached the end
      if (nextSectionIndex >= conversationState.formDefinition.sections.length) {
        return {
          isComplete: true,
          completionMessage: 'Thank you for completing the workflow!'
        };
      }

      return {
        sectionIndex: nextSectionIndex,
        nodeIndex: nextNodeIndex,
        isComplete: false
      };

    } catch (error) {
      logger.error('Failed to determine next step', { error: error.message });
      return {
        isComplete: true,
        completionMessage: 'Workflow completed.'
      };
    }
  }

  /**
   * Evaluate branch condition
   * @param {Object} branch - Branch definition
   * @param {string} responseValue - User's response
   * @returns {boolean} Whether condition is met
   * @private
   */
  evaluateBranchCondition(branch, responseValue) {
    try {
      if (branch.conditions && branch.conditions.length > 0) {
        const condition = branch.conditions[0];
        if (condition.block && condition.block.choice) {
          return condition.block.choice === responseValue;
        }
      }
      return false;
    } catch (error) {
      logger.error('Failed to evaluate branch condition', { error: error.message });
      return false;
    }
  }

  /**
   * Get question at specific step
   * @param {Object} formDefinition - Form definition
   * @param {Object} step - Step information
   * @returns {Object} Question object
   * @private
   */
  getQuestionAtStep(formDefinition, step) {
    try {
      const section = formDefinition.sections[step.sectionIndex];
      const node = section.nodes[step.nodeIndex];
      
      let messageText = node.name;
      const options = [];
      
      if (node.block && node.block.type === '@tripetto/block-multiple-choice') {
        for (let i = 0; i < node.block.choices.length; i++) {
          const choice = node.block.choices[i];
          options.push({
            id: choice.id,
            text: `${i + 1}. ${choice.name}`,
            value: choice.name
          });
        }
      }

      return {
        text: messageText,
        question: {
          nodeId: node.id,
          type: node.block?.type || 'text',
          text: node.name
        },
        options: options
      };

    } catch (error) {
      logger.error('Failed to get question at step', { error: error.message });
      return {
        text: 'How can I help you?',
        question: { nodeId: 'default', type: 'text', text: 'How can I help you?' },
        options: []
      };
    }
  }

  /**
   * Get total steps in form
   * @param {Object} formDefinition - Form definition
   * @returns {number} Total steps
   * @private
   */
  getTotalSteps(formDefinition) {
    try {
      let total = 0;
      for (const section of formDefinition.sections) {
        if (section.nodes) {
          total += section.nodes.length;
        }
      }
      return Math.max(total, 1);
    } catch (error) {
      return 1;
    }
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    return {
      conversationStats: conversationStateService.getStats(),
      availableForms: getAvailableTriggers().length
    };
  }

  /**
   * Get conversation statistics (alias for compatibility)
   * @returns {Object} Conversation statistics
   */
  getStatistics() {
    return conversationStateService.getStats();
  }

  /**
   * Check if user has an active conversation
   * @param {string} userId - User ID to check
   * @returns {boolean} True if user has active conversation
   */
  hasActiveConversation(userId) {
    try {
      const conversation = conversationStateService.getConversation(userId);
      return conversation && !conversation.complete;
    } catch (error) {
      logger.error('Error checking active conversation:', { userId, error: error.message });
      return false;
    }
  }

  /**
   * Check if service is enabled
   * @returns {boolean} Always true for now
   */
  isEnabled() {
    return true;
  }
}

// Export singleton instance
module.exports = new TripettoService();