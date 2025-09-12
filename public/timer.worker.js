// A simpler, more robust timer worker
let timerId = null;
let timeLeft = 0;
let isRunning = false;

/**
 * Stops the interval timer but preserves the timeLeft value.
 * This effectively "pauses" the timer.
 */
function pauseTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  isRunning = false;
}

// Main message handler from the browser's main thread
self.onmessage = function (e) {
  const { command, duration } = e.data;

  switch (command) {
    case "start":
      // If a timer is already running, clear it before starting a new one.
      if (timerId) {
        clearInterval(timerId);
      }

      // Set the time from the duration sent by the main thread.
      // This works for both starting a new timer and resuming a paused one,
      // as the component sends the remaining time.
      timeLeft = duration;
      isRunning = true;

      timerId = setInterval(() => {
        if (timeLeft <= 0) {
          // Timer finished. Clean up and notify the main thread.
          pauseTimer();
          self.postMessage({ type: "sessionEnd" });
          return;
        }

        // Decrement time and send a tick update
        timeLeft--;
        self.postMessage({ type: "tick", timeLeft: timeLeft });
      }, 1000);
      break;

    case "stop":
      // This command now correctly functions as a "pause".
      // It stops the timer but does NOT reset timeLeft.
      pauseTimer();
      break;

    case "sync":
      // When asked for an update, report the current state.
      // Since timeLeft is preserved on pause, this will be accurate.
      self.postMessage({
        type: "sync-response",
        timeLeft: timeLeft,
        isRunning: isRunning,
      });
      break;
  }
};
