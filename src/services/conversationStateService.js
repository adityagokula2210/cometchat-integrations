/**
 * Conversation State Service
 * Manages user conversation states for Tripetto workflows
 */

const logger = require('../utils/logger');

class ConversationStateService {
  constructor() {
    // In-memory storage for conversation states
    // In production, you'd use Redis or database
    this.conversations = new Map();
    
    // Session timeout (30 minutes)
    this.sessionTimeout = 30 * 60 * 1000;
    
    // Cleanup expired conversations every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredConversations();
    }, 5 * 60 * 1000);

    logger.info('Conversation State Service initialized', {
      sessionTimeout: this.sessionTimeout,
      cleanupInterval: '5 minutes'
    });
  }

  /**
   * Start a new conversation for a user
   * @param {string} userId - User identifier
   * @param {string} formId - Form identifier
   * @param {Object} formDefinition - Tripetto form definition
   * @returns {Object} Initial conversation state
   */
  async startConversation(userId, formId, formDefinition) {
    try {
      // End any existing conversation for this user
      if (this.conversations.has(userId)) {
        await this.endConversation(userId, 'replaced');
      }

      const conversationState = {
        userId,
        formId,
        formDefinition,
        currentSectionIndex: 0,
        currentNodeIndex: 0,
        responses: {},
        metadata: {
          startedAt: new Date(),
          lastActivity: new Date(),
          progress: 0,
          totalNodes: this.countTotalNodes(formDefinition)
        },
        isActive: true
      };

      this.conversations.set(userId, conversationState);

      logger.info('Conversation started', {
        userId,
        formId,
        totalNodes: conversationState.metadata.totalNodes
      });

      return conversationState;

    } catch (error) {
      logger.error('Failed to start conversation', {
        userId,
        formId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user's current conversation state
   * @param {string} userId - User identifier
   * @returns {Object|null} Conversation state or null
   */
  async getUserConversationState(userId) {
    const state = this.conversations.get(userId);
    
    if (state) {
      // Check if conversation has expired
      const now = new Date();
      const lastActivity = new Date(state.metadata.lastActivity);
      const timeDiff = now - lastActivity;
      
      if (timeDiff > this.sessionTimeout) {
        await this.endConversation(userId, 'expired');
        return null;
      }
      
      // Update last activity
      state.metadata.lastActivity = now;
    }
    
    return state;
  }

  /**
   * Update conversation progress
   * @param {string} userId - User identifier
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated conversation state
   */
  async updateConversationProgress(userId, updates) {
    try {
      const state = await this.getUserConversationState(userId);
      
      if (!state) {
        throw new Error('No active conversation found');
      }

      // Apply updates
      if (updates.responses) {
        Object.assign(state.responses, updates.responses);
      }
      
      if (updates.currentSectionIndex !== undefined) {
        state.currentSectionIndex = updates.currentSectionIndex;
      }
      
      if (updates.currentNodeIndex !== undefined) {
        state.currentNodeIndex = updates.currentNodeIndex;
      }

      // Update progress
      const completedNodes = Object.keys(state.responses).length;
      state.metadata.progress = (completedNodes / state.metadata.totalNodes) * 100;
      state.metadata.lastActivity = new Date();

      // Check if conversation is complete
      if (updates.isComplete) {
        state.isActive = false;
        state.metadata.completedAt = new Date();
      }

      logger.debug('Conversation updated', {
        userId,
        progress: state.metadata.progress,
        responses: Object.keys(state.responses).length
      });

      return state;

    } catch (error) {
      logger.error('Failed to update conversation', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * End a conversation
   * @param {string} userId - User identifier
   * @param {string} reason - Reason for ending (completed, cancelled, expired)
   * @returns {boolean} Success status
   */
  async endConversation(userId, reason = 'completed') {
    try {
      const state = this.conversations.get(userId);
      
      if (state) {
        state.isActive = false;
        state.metadata.endedAt = new Date();
        state.metadata.endReason = reason;
        
        logger.info('Conversation ended', {
          userId,
          formId: state.formId,
          reason,
          duration: state.metadata.endedAt - new Date(state.metadata.startedAt),
          progress: state.metadata.progress
        });
        
        // Remove from active conversations after a delay (for potential retrieval)
        setTimeout(() => {
          this.conversations.delete(userId);
        }, 60000); // Keep for 1 minute
      }

      return true;

    } catch (error) {
      logger.error('Failed to end conversation', {
        userId,
        reason,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Count total nodes in a form definition
   * @param {Object} formDefinition - Tripetto form definition
   * @returns {number} Total number of nodes
   * @private
   */
  countTotalNodes(formDefinition) {
    try {
      let count = 0;
      
      if (formDefinition.sections && Array.isArray(formDefinition.sections)) {
        for (const section of formDefinition.sections) {
          if (section.nodes && Array.isArray(section.nodes)) {
            count += section.nodes.length;
          }
        }
      }
      
      return Math.max(count, 1); // At least 1 to avoid division by zero
      
    } catch (error) {
      logger.warn('Failed to count form nodes', { error: error.message });
      return 1;
    }
  }

  /**
   * Clean up expired conversations
   * @private
   */
  cleanupExpiredConversations() {
    try {
      const now = new Date();
      let cleanedCount = 0;

      for (const [userId, state] of this.conversations.entries()) {
        const lastActivity = new Date(state.metadata.lastActivity);
        const timeDiff = now - lastActivity;
        
        if (timeDiff > this.sessionTimeout) {
          this.conversations.delete(userId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info('Cleaned up expired conversations', {
          cleanedCount,
          activeConversations: this.conversations.size
        });
      }

    } catch (error) {
      logger.error('Failed to cleanup conversations', { error: error.message });
    }
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStats() {
    const activeConversations = Array.from(this.conversations.values())
      .filter(state => state.isActive).length;
    
    const completedConversations = Array.from(this.conversations.values())
      .filter(state => !state.isActive && state.metadata.endReason === 'completed').length;

    return {
      totalUsers: this.conversations.size,
      activeConversations,
      completedConversations,
      sessionTimeout: this.sessionTimeout
    };
  }

  /**
   * Get conversation state (simple getter)
   * @param {string} userId - User identifier
   * @returns {Object|null} Conversation state or null
   */
  getConversation(userId) {
    const state = this.conversations.get(userId);
    
    if (state) {
      // Check if conversation has expired
      const now = new Date();
      const lastActivity = new Date(state.metadata.lastActivity);
      const timeDiff = now - lastActivity;
      
      if (timeDiff > this.sessionTimeout) {
        return null; // Expired
      }
    }
    
    return state || null;
  }

  /**
   * Cleanup service resources
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    logger.info('Conversation State Service shutdown');
  }
}

// Export singleton instance
module.exports = new ConversationStateService();