/**
 * Telegram API Service
 * Handles sending messages to Telegram using Bot API
 */

const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

class TelegramApiService {
  constructor() {
    this.botToken = config.telegram.botToken;
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    
    if (!this.botToken) {
      logger.error('Telegram bot token not configured');
      return;
    }

    logger.info('Telegram API service initialized', {
      hasToken: !!this.botToken
    });
  }

  /**
   * Send text message to Telegram chat
   * @param {string} chatId - Telegram chat ID
   * @param {Object} message - Message object with text and metadata
   */
  async sendMessage(chatId, message) {
    try {
      if (!this.botToken) {
        throw new Error('Telegram bot token not configured');
      }

      const messageText = typeof message === 'string' ? message : message.text;
      
      const payload = {
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      };

      const response = await axios.post(`${this.baseUrl}/sendMessage`, payload);

      logger.info('Message sent to Telegram', {
        chatId,
        messageId: response.data.result.message_id,
        textLength: messageText.length
      });

      return {
        success: true,
        messageId: response.data.result.message_id,
        platform: 'telegram',
        chatId
      };

    } catch (error) {
      logger.error('Failed to send Telegram message', {
        chatId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      throw error;
    }
  }

  /**
   * Send photo to Telegram chat
   * @param {string} chatId - Telegram chat ID
   * @param {string} photoUrl - URL of the photo
   * @param {string} caption - Photo caption
   */
  async sendPhoto(chatId, photoUrl, caption = '') {
    try {
      if (!this.botToken) {
        throw new Error('Telegram bot token not configured');
      }

      const payload = {
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'HTML'
      };

      const response = await axios.post(`${this.baseUrl}/sendPhoto`, payload);

      logger.info('Photo sent to Telegram', {
        chatId,
        messageId: response.data.result.message_id,
        photoUrl
      });

      return {
        success: true,
        messageId: response.data.result.message_id,
        platform: 'telegram',
        chatId
      };

    } catch (error) {
      logger.error('Failed to send Telegram photo', {
        chatId,
        photoUrl,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Send document to Telegram chat
   * @param {string} chatId - Telegram chat ID
   * @param {string} documentUrl - URL of the document
   * @param {string} caption - Document caption
   */
  async sendDocument(chatId, documentUrl, caption = '') {
    try {
      if (!this.botToken) {
        throw new Error('Telegram bot token not configured');
      }

      const payload = {
        chat_id: chatId,
        document: documentUrl,
        caption: caption,
        parse_mode: 'HTML'
      };

      const response = await axios.post(`${this.baseUrl}/sendDocument`, payload);

      logger.info('Document sent to Telegram', {
        chatId,
        messageId: response.data.result.message_id,
        documentUrl
      });

      return {
        success: true,
        messageId: response.data.result.message_id,
        platform: 'telegram',
        chatId
      };

    } catch (error) {
      logger.error('Failed to send Telegram document', {
        chatId,
        documentUrl,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Get bot information
   */
  async getBotInfo() {
    try {
      const response = await axios.get(`${this.baseUrl}/getMe`);
      return response.data.result;
    } catch (error) {
      logger.error('Failed to get Telegram bot info', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Test if service is working
   */
  async testConnection() {
    try {
      const botInfo = await this.getBotInfo();
      logger.info('Telegram API connection test successful', {
        botUsername: botInfo.username,
        botId: botInfo.id
      });
      return true;
    } catch (error) {
      logger.error('Telegram API connection test failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Format message for Telegram (HTML parsing)
   * @param {Object} sourceMessage - Original message
   */
  formatMessage(sourceMessage) {
    const author = sourceMessage.author.name;
    const content = sourceMessage.content.text;
    const sourcePlatform = sourceMessage.source.charAt(0).toUpperCase() + sourceMessage.source.slice(1);
    
    // Basic HTML formatting for Telegram
    const formattedContent = `<b>[${sourcePlatform}]</b> <i>${author}:</i>\n${content}`;
    
    return {
      text: formattedContent,
      parse_mode: 'HTML'
    };
  }
}

// Export singleton instance
module.exports = new TelegramApiService();