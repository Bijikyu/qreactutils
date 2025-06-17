/**
 * Socket.IO WebSocket Communication Module
 * 
 * This module handles real-time WebSocket connections for payment outcomes
 * and usage tracking. It provides standardized connection management,
 * event handling, and cleanup patterns for Socket.IO integration.
 */

const { useState, useEffect, useMemo } = require('react');

/**
 * React hook for Socket.IO WebSocket communication with payment and usage tracking
 *
 * This hook manages WebSocket connections for real-time payment outcomes and usage updates.
 * It automatically handles connection lifecycle, event subscriptions, and cleanup to prevent
 * memory leaks. The hook follows the library's logging patterns and state management conventions.
 *
 * Design decisions:
 * - Uses environment detection to connect to appropriate backend URL
 * - Automatically subscribes to user-specific events using provided userId
 * - Normalizes payment events into consistent outcome objects with status field
 * - Cleans up all event listeners and disconnects socket on unmount
 * - Returns stable state object to prevent unnecessary re-renders
 *
 * The implementation prioritizes connection reliability over performance, ensuring
 * that failed connections are properly cleaned up and event listeners don't leak.
 * All socket events are logged for debugging support in development.
 *
 * @param {string} userId - User identifier for event subscription
 * @returns {Object} State object containing paymentOutcome and usageUpdate
 */
function useSocket(userId) {
  console.log(`useSocket is running with userId ${userId}`); // log hook entry with id
  
  const [paymentOutcome, setPaymentOutcome] = useState(null); // track payment success/failure events
  const [usageUpdate, setUsageUpdate] = useState(null); // track usage update events
  
  useEffect(() => {
    // Import socket.io-client dynamically to avoid bundling issues
    const { io } = require('socket.io-client');
    
    // Determine backend URL based on environment - dev uses localhost, production uses current origin
    const url = (typeof window !== 'undefined' && window.location) 
      ? (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin)
      : 'http://localhost:5000'; // fallback for server-side rendering
    
    console.log(`useSocket connecting to ${url}`); // log selected URL for debugging
    
    const socket = io(url); // connect to socket server with chosen URL
    
    // Subscribe to user-specific events after connection
    socket.emit('subscribe', userId); // subscribe with user id after connection
    
    // Set up event listeners for payment outcomes with status normalization
    socket.on('paymentSuccess', (data) => {
      console.log(`useSocket received paymentSuccess:`, data); // log payment success event
      setPaymentOutcome({ status: 'success', ...data }); // normalize with success status
    });
    
    socket.on('paymentFailure', (data) => {
      console.log(`useSocket received paymentFailure:`, data); // log payment failure event
      setPaymentOutcome({ status: 'failure', ...data }); // normalize with failure status
    });
    
    socket.on('usageUpdate', (data) => {
      console.log(`useSocket received usageUpdate:`, data); // log usage update event
      setUsageUpdate(data); // store usage data directly without transformation
    });
    
    // Cleanup function removes all listeners and disconnects socket
    return () => {
      console.log(`useSocket cleaning up connection for userId ${userId}`); // log cleanup
      socket.off('paymentSuccess'); // remove payment success listener
      socket.off('paymentFailure'); // remove payment failure listener  
      socket.off('usageUpdate'); // remove usage update listener
      socket.disconnect(); // close socket connection
    };
  }, [userId]); // re-establish connection when userId changes
  
  // Return stable state object to prevent unnecessary re-renders in consuming components
  const state = useMemo(() => ({ 
    paymentOutcome, 
    usageUpdate 
  }), [paymentOutcome, usageUpdate]); // memoize to maintain reference stability
  
  console.log(`useSocket is returning ${JSON.stringify(state)}`); // exit log with current state
  return state; // return current payment and usage state
}

module.exports = {
  useSocket
};