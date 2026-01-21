/**
 * MCP Session Manager
 * Manages MCP connections based on user sessions to prevent premature disconnections
 */

// Module-level variables (previously class instance variables)
// Map of userId -> session info
const userSessions = new Map();

// Map of transportId -> userId for quick lookup
const transportToUser = new Map();

// Map of userId -> cleanup timeout
const cleanupTimeouts = new Map();

// Grace period before cleanup (5 minutes)
const gracePeriod = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Register a transport connection with user session
 */
function registerTransport(transportId, userId, sessionData = {}) {
    
    // Store user session info
    userSessions.set(userId, {
        lastActivity: Date.now(),
        transports: userSessions.get(userId)?.transports || new Set(),
        sessionData: { ...sessionData },
        isActive: true
    });
    
    // Add transport to user's transport set
    userSessions.get(userId).transports.add(transportId);
    
    // Map transport to user for quick lookup
    transportToUser.set(transportId, userId);
    
    // Clear any existing cleanup timeout for this user
    if (cleanupTimeouts.has(userId)) {
        clearTimeout(cleanupTimeouts.get(userId));
        cleanupTimeouts.delete(userId);
    }
}

/**
 * Handle transport disconnection
 */
function handleTransportDisconnect(transportId) {
    const userId = transportToUser.get(transportId);
    
    if (!userId) {
        return { shouldCleanup: true, gracePeriod: 0 };
    }
    
    console.log(`🔌 [MCP Session Manager] Transport ${transportId} disconnected for user ${userId}`);
    
    // Remove transport from user's transport set
    const userSession = userSessions.get(userId);
    if (userSession) {
        userSession.transports.delete(transportId);
    }
    
    // Remove transport mapping
    transportToUser.delete(transportId);
    
    // Check if user has other active transports
    const hasOtherTransports = userSession && userSession.transports.size > 0;
    
    if (hasOtherTransports) {
        return { shouldCleanup: false, gracePeriod: 0 };
    }
    
    // Schedule cleanup with grace period
    const timeoutId = setTimeout(() => {
        cleanupUserSession(userId);
    }, gracePeriod);
    
    cleanupTimeouts.set(userId, timeoutId);
    
    
    return { 
        shouldCleanup: false, 
        gracePeriod: gracePeriod 
    };
}

/**
 * Update user activity timestamp
 */
function updateUserActivity(userId) {
    if (userSessions.has(userId)) {
        userSessions.get(userId).lastActivity = Date.now();
        
        // Clear cleanup timeout if exists (user is active)
        if (cleanupTimeouts.has(userId)) {
            clearTimeout(cleanupTimeouts.get(userId));
            cleanupTimeouts.delete(userId);
        }
    }
}

/**
 * Check if user session is active
 */
function isUserSessionActive(userId) {
    const userSession = userSessions.get(userId);
    if (!userSession) return false;
    
    const now = Date.now();
    const timeSinceLastActivity = now - userSession.lastActivity;
    
    // Consider session active if last activity was within 10 minutes
    const sessionTimeout = 10 * 60 * 1000; // 10 minutes
    
    return timeSinceLastActivity < sessionTimeout && userSession.isActive;
}

/**
 * Get user ID from transport ID
 */
function getUserFromTransport(transportId) {
    return transportToUser.get(transportId);
}

/**
 * Get user session info
 */
function getUserSession(userId) {
    return userSessions.get(userId);
}

/**
 * Clean up user session and all associated data
 */
function cleanupUserSession(userId) {
    
    const userSession = userSessions.get(userId);
    if (!userSession) {
        return false;
    }
    
    // Remove all transport mappings for this user
    for (const transportId of userSession.transports) {
        transportToUser.delete(transportId);
    }
    
    // Clear cleanup timeout if exists
    if (cleanupTimeouts.has(userId)) {
        clearTimeout(cleanupTimeouts.get(userId));
        cleanupTimeouts.delete(userId);
    }
    
    // Remove user session
    userSessions.delete(userId);
    
    return true;
}

/**
 * Get session statistics
 */
function getStats() {
    return {
        activeSessions: userSessions.size,
        activeTransports: transportToUser.size,
        pendingCleanups: cleanupTimeouts.size
    };
}

/**
 * Start periodic cleanup of inactive sessions
 */
function startPeriodicCleanup() {
    setInterval(() => {
        const now = Date.now();
        const inactiveThreshold = 15 * 60 * 1000; // 15 minutes
        
        for (const [userId, session] of userSessions.entries()) {
            const timeSinceLastActivity = now - session.lastActivity;
            
            if (timeSinceLastActivity > inactiveThreshold) {
                cleanupUserSession(userId);
            }
        }
    }, 5 * 60 * 1000); // Check every 5 minutes
}

// Initialize the session manager
function initialize() {
    // Start periodic cleanup
    startPeriodicCleanup();
    console.log('🔧 [MCP Session Manager] Initialized');
}

// Initialize on module load
initialize();

// Export all functions
module.exports = {
    registerTransport,
    handleTransportDisconnect,
    updateUserActivity,
    isUserSessionActive,
    getUserFromTransport,
    getUserSession,
    cleanupUserSession,
    getStats,
    startPeriodicCleanup,
    initialize
};