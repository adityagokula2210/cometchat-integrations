/**
 * Bridge Configuration Service
 * Manages platform-to-platform message routing with hardcoded bridge mappings
 * 
 * For now, we'll use hardcoded values for quick implementation.
 * Later can be evolved to use environment variables or JSON config.
 */

const logger = require('../utils/logger');

class BridgeConfigService {
  constructor() {
    // Hardcoded bridge configuration
    // TODO: Move to environment variables or config file later
    this.bridges = [
      {
        id: 'main_bridge',
        name: 'Main Community Bridge',
        enabled: true,
        platforms: {
          discord: {
            channelId: 'DISCORD_CHANNEL_ID_PLACEHOLDER', // Will be updated once we get the ID from logs
            guildId: 'DISCORD_GUILD_ID_PLACEHOLDER'      // Will be updated once we get the ID from logs
          },
          telegram: {
            chatId: '-4969601855'              // Your actual Telegram group ID
          },
          cometchat: {
            groupId: 'cometchat-guid-1'        // Your actual CometChat group ID
          }
        },
        settings: {
          syncMessages: true,
          syncFiles: true,
          maxMessageLength: 2000
        }
      }
      // Add more bridges here as needed
      // {
      //   id: 'support_bridge',
      //   name: 'Support Channel Bridge',
      //   enabled: true,
      //   platforms: {
      //     discord: { channelId: '9876543210987654321' },
      //     telegram: { chatId: '-1009876543210' },
      //     cometchat: { groupId: 'support_group_456' }
      //   }
      // }
    ];

    logger.info('Bridge configuration loaded', {
      totalBridges: this.bridges.length,
      enabledBridges: this.bridges.filter(b => b.enabled).length
    });
  }

  /**
   * Get all enabled bridges
   */
  getEnabledBridges() {
    return this.bridges.filter(bridge => bridge.enabled);
  }

  /**
   * Find bridge by platform and ID
   * @param {string} platform - 'discord', 'telegram', or 'cometchat'
   * @param {string} platformId - Channel/Chat/Group ID
   */
  getBridgeByPlatformId(platform, platformId) {
    return this.bridges.find(bridge => {
      if (!bridge.enabled) return false;
      
      const platformConfig = bridge.platforms[platform];
      if (!platformConfig) return false;

      // Check different ID types based on platform
      switch (platform) {
        case 'discord':
          return platformConfig.channelId === platformId;
        case 'telegram':
          return platformConfig.chatId === platformId;
        case 'cometchat':
          return platformConfig.groupId === platformId;
        default:
          return false;
      }
    });
  }

  /**
   * Get target platforms for a message from source platform
   * @param {string} sourcePlatform - Source platform name
   * @param {string} sourceId - Source platform ID
   */
  getTargetPlatforms(sourcePlatform, sourceId) {
    const bridge = this.getBridgeByPlatformId(sourcePlatform, sourceId);
    
    if (!bridge) {
      logger.warn('No bridge found for message', {
        sourcePlatform,
        sourceId
      });
      return [];
    }

    const targets = [];
    
    // Get all other platforms in the same bridge
    Object.keys(bridge.platforms).forEach(platform => {
      if (platform !== sourcePlatform) {
        const config = bridge.platforms[platform];
        targets.push({
          platform,
          bridgeId: bridge.id,
          bridgeName: bridge.name,
          ...config
        });
      }
    });

    logger.debug('Found target platforms', {
      sourcePlatform,
      sourceId,
      bridgeId: bridge.id,
      targetCount: targets.length,
      targets: targets.map(t => ({ platform: t.platform, id: t.channelId || t.chatId || t.groupId }))
    });

    return targets;
  }

  /**
   * Check if a platform/ID combination is configured for bridging
   * @param {string} platform - Platform name
   * @param {string} platformId - Platform ID
   */
  isBridgeEnabled(platform, platformId) {
    const bridge = this.getBridgeByPlatformId(platform, platformId);
    return bridge !== undefined;
  }

  /**
   * Get bridge settings for a platform/ID
   * @param {string} platform - Platform name
   * @param {string} platformId - Platform ID
   */
  getBridgeSettings(platform, platformId) {
    const bridge = this.getBridgeByPlatformId(platform, platformId);
    return bridge ? bridge.settings : null;
  }

  /**
   * Update hardcoded values (for development/testing)
   * This method allows easy updating of IDs during development
   */
  updateBridgeIds(bridgeId, platformUpdates) {
    const bridge = this.bridges.find(b => b.id === bridgeId);
    if (!bridge) {
      logger.error('Bridge not found for update', { bridgeId });
      return false;
    }

    Object.keys(platformUpdates).forEach(platform => {
      if (bridge.platforms[platform]) {
        Object.assign(bridge.platforms[platform], platformUpdates[platform]);
      }
    });

    logger.info('Bridge configuration updated', {
      bridgeId,
      updates: platformUpdates
    });

    return true;
  }

  /**
   * Get configuration summary for debugging
   */
  getConfigSummary() {
    return {
      totalBridges: this.bridges.length,
      enabledBridges: this.bridges.filter(b => b.enabled).length,
      bridges: this.bridges.map(bridge => ({
        id: bridge.id,
        name: bridge.name,
        enabled: bridge.enabled,
        platforms: Object.keys(bridge.platforms),
        platformIds: Object.keys(bridge.platforms).reduce((acc, platform) => {
          const config = bridge.platforms[platform];
          acc[platform] = config.channelId || config.chatId || config.groupId;
          return acc;
        }, {})
      }))
    };
  }
}

// Export singleton instance
module.exports = new BridgeConfigService();