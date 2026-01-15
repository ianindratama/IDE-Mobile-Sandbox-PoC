/**
 * Session Manager for Companion Mode
 * Handles pairing between web IDE and mobile companion app
 */

class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Generate a unique 6-character pairing code
   */
  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like 0/O, 1/I
    let code;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.sessions.has(code));
    return code;
  }

  /**
   * Create a new session for a web IDE client
   */
  createSession(webSocketId) {
    const code = this.generateCode();
    const session = {
      code,
      webSocketId,
      mobileSocketId: null,
      createdAt: Date.now(),
      lastCode: ''
    };
    this.sessions.set(code, session);
    console.log(`[Session] Created session ${code} for web client ${webSocketId}`);
    return session;
  }

  /**
   * Join an existing session from mobile app
   */
  joinSession(code, mobileSocketId) {
    const session = this.sessions.get(code.toUpperCase());
    if (!session) {
      return { success: false, error: 'Session not found' };
    }
    if (session.mobileSocketId) {
      return { success: false, error: 'Session already has a connected device' };
    }
    session.mobileSocketId = mobileSocketId;
    console.log(`[Session] Mobile client ${mobileSocketId} joined session ${code}`);
    return { success: true, session };
  }

  /**
   * Get session by code
   */
  getSession(code) {
    return this.sessions.get(code.toUpperCase());
  }

  /**
   * Get session by web socket ID
   */
  getSessionByWebId(webSocketId) {
    for (const session of this.sessions.values()) {
      if (session.webSocketId === webSocketId) {
        return session;
      }
    }
    return null;
  }

  /**
   * Get session by mobile socket ID
   */
  getSessionByMobileId(mobileSocketId) {
    for (const session of this.sessions.values()) {
      if (session.mobileSocketId === mobileSocketId) {
        return session;
      }
    }
    return null;
  }

  /**
   * Remove a session
   */
  removeSession(code) {
    console.log(`[Session] Removing session ${code}`);
    return this.sessions.delete(code.toUpperCase());
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(socketId) {
    // Check if it's a web client
    const webSession = this.getSessionByWebId(socketId);
    if (webSession) {
      console.log(`[Session] Web client disconnected, removing session ${webSession.code}`);
      this.removeSession(webSession.code);
      return { type: 'web', session: webSession };
    }

    // Check if it's a mobile client
    const mobileSession = this.getSessionByMobileId(socketId);
    if (mobileSession) {
      console.log(`[Session] Mobile client disconnected from session ${mobileSession.code}`);
      mobileSession.mobileSocketId = null;
      return { type: 'mobile', session: mobileSession };
    }

    return null;
  }

  /**
   * Update the last code in a session
   */
  updateCode(code, newCode) {
    const session = this.sessions.get(code.toUpperCase());
    if (session) {
      session.lastCode = newCode;
    }
  }
}

module.exports = SessionManager;
