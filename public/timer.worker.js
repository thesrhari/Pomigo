/**
 * @file An enhanced web worker to run a countdown timer in the background.
 * This worker manages the full countdown logic to ensure it runs accurately
 * even when the tab is inactive.
 */

let timerId = null; // Holds the ID of the interval, so we can clear it.
let timeLeft = 0; // Holds the current countdown time in seconds within the worker.

// Listen for messages from the main thread
self.onmessage = function (e) {
  // The main thread will now send a 'duration' when starting.
  const { command, duration } = e.data;

  switch (command) {
    case "start":
      // Always clear any existing timer before starting a new one.
      // This prevents multiple timers from running simultaneously.
      if (timerId) {
        clearInterval(timerId);
      }

      // Set the initial time for this countdown session from the message data.
      timeLeft = duration;

      // Start a new interval that runs every 1000ms (1 second).
      timerId = setInterval(() => {
        timeLeft--; // Decrement the time left.

        if (timeLeft > 0) {
          // If there's still time left, post a 'tick' message
          // back to the main thread with the new remaining time.
          // The main thread will use this value just for display purposes.
          self.postMessage({ type: "tick", timeLeft: timeLeft });
        } else {
          // If the countdown has finished (timeLeft is 0 or less):
          // 1. Post a special 'sessionEnd' message to the main thread.
          //    This is the reliable trigger for playing the sound and changing the session.
          self.postMessage({ type: "sessionEnd" });

          // 2. Stop the interval and clear the ID to clean up.
          clearInterval(timerId);
          timerId = null;
        }
      }, 1000); // The interval is hardcoded to 1 second.
      break;

    case "stop":
      // If a 'stop' command is received, clear the interval and reset the ID.
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      break;
  }
};
