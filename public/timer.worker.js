/**
 * @file Enhanced web worker for countdown timer with multiple fallback mechanisms
 * This worker uses multiple timing strategies to ensure reliability even when
 * the browser throttles background tabs.
 */

let timerId = null;
let timeLeft = 0;
let startTime = null;
let expectedDuration = 0;
let highResTimerId = null;
let broadcastChannel = null;

// Initialize BroadcastChannel if available (for cross-tab communication)
try {
  if (typeof BroadcastChannel !== "undefined") {
    broadcastChannel = new BroadcastChannel("pomodoro-timer");
  }
} catch (err) {
  console.warn("BroadcastChannel not available");
}

// High-resolution timer fallback
function startHighResTimer() {
  if (highResTimerId) {
    clearTimeout(highResTimerId);
  }

  const tick = () => {
    if (timeLeft <= 0) return;

    // Calculate actual elapsed time to account for throttling
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    const calculatedTimeLeft = Math.max(0, expectedDuration - elapsedSeconds);

    // Use the more accurate calculation
    timeLeft = calculatedTimeLeft;

    if (timeLeft > 0) {
      self.postMessage({ type: "tick", timeLeft: timeLeft });

      // Broadcast to other tabs if available
      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage({
            type: "timer-update",
            timeLeft: timeLeft,
            timestamp: now,
          });
        } catch (err) {
          console.warn("BroadcastChannel error:", err);
        }
      }

      // Schedule next tick with slight randomization to avoid throttling patterns
      const delay = 900 + Math.random() * 200; // 900-1100ms
      highResTimerId = setTimeout(tick, delay);
    } else {
      // Timer finished
      self.postMessage({ type: "sessionEnd" });

      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage({
            type: "session-end",
            timestamp: Date.now(),
          });
        } catch (err) {
          console.warn("BroadcastChannel error:", err);
        }
      }

      cleanup();
    }
  };

  tick();
}

function cleanup() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  if (highResTimerId) {
    clearTimeout(highResTimerId);
    highResTimerId = null;
  }
  startTime = null;
  expectedDuration = 0;
}

// Listen for page visibility changes to adjust timing strategy
self.addEventListener("message", function (e) {
  if (e.data.type === "visibility-change") {
    // Page became visible/hidden - we can adjust our strategy here if needed
    if (timeLeft > 0 && startTime) {
      // Recalculate time left based on actual elapsed time
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      timeLeft = Math.max(0, expectedDuration - elapsedSeconds);

      self.postMessage({ type: "tick", timeLeft: timeLeft });

      if (timeLeft === 0) {
        self.postMessage({ type: "sessionEnd" });
        cleanup();
      }
    }
  }
});

// Main message handler
self.onmessage = function (e) {
  const { command, duration } = e.data;

  switch (command) {
    case "start":
      cleanup(); // Clear any existing timers

      timeLeft = duration;
      expectedDuration = duration;
      startTime = Date.now();

      // Strategy 1: Regular interval (will be throttled in background)
      timerId = setInterval(() => {
        // Calculate actual elapsed time
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const calculatedTimeLeft = Math.max(
          0,
          expectedDuration - elapsedSeconds
        );

        // Use the more accurate of the two calculations
        const decrementedTime = timeLeft - 1;
        timeLeft = Math.min(decrementedTime, calculatedTimeLeft);

        if (timeLeft > 0) {
          self.postMessage({ type: "tick", timeLeft: timeLeft });
        } else {
          self.postMessage({ type: "sessionEnd" });
          cleanup();
        }
      }, 1000);

      // Strategy 2: High-resolution timer with drift correction
      startHighResTimer();

      // Strategy 3: Broadcast timer state for cross-tab sync
      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage({
            type: "timer-start",
            duration: duration,
            startTime: startTime,
          });
        } catch (err) {
          console.warn("BroadcastChannel error:", err);
        }
      }
      break;

    case "stop":
      cleanup();

      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage({
            type: "timer-stop",
            timestamp: Date.now(),
          });
        } catch (err) {
          console.warn("BroadcastChannel error:", err);
        }
      }
      break;

    case "sync":
      // Allow main thread to sync with worker state
      if (startTime && timeLeft > 0) {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const calculatedTimeLeft = Math.max(
          0,
          expectedDuration - elapsedSeconds
        );
        timeLeft = calculatedTimeLeft;

        self.postMessage({
          type: "sync-response",
          timeLeft: timeLeft,
          isRunning: timerId !== null,
        });
      } else {
        self.postMessage({
          type: "sync-response",
          timeLeft: 0,
          isRunning: false,
        });
      }
      break;
  }
};

// Listen for messages from other tabs via BroadcastChannel
if (broadcastChannel) {
  broadcastChannel.onmessage = function (e) {
    const { type, timeLeft: syncTimeLeft, timestamp } = e.data;

    // Sync with other tabs if they have more recent data
    if (type === "timer-update" && syncTimeLeft !== undefined) {
      const now = Date.now();
      const timeDiff = Math.abs(now - timestamp);

      // Only sync if the timestamp is recent (within 2 seconds)
      if (timeDiff < 2000 && Math.abs(timeLeft - syncTimeLeft) > 1) {
        timeLeft = syncTimeLeft;
        self.postMessage({ type: "tick", timeLeft: timeLeft });
      }
    }

    if (type === "session-end") {
      self.postMessage({ type: "sessionEnd" });
      cleanup();
    }
  };
}

// Send periodic heartbeats to detect if worker is being throttled
let heartbeatInterval = setInterval(() => {
  self.postMessage({
    type: "heartbeat",
    timestamp: Date.now(),
    isActive: timerId !== null,
  });
}, 5000);

// Cleanup on worker termination
self.addEventListener("beforeunload", cleanup);
