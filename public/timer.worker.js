/**
 * @file A simple web worker to run a timer in the background.
 */

let intervalId = null;

// Listen for messages from the main thread
self.onmessage = function (e) {
  const { command, ms } = e.data;

  switch (command) {
    case "start":
      // Clear any existing interval to prevent multiple timers running
      if (intervalId) {
        clearInterval(intervalId);
      }
      // Start a new interval
      intervalId = setInterval(() => {
        // Post a 'tick' message back to the main thread
        self.postMessage({ type: "tick" });
      }, ms);
      break;
    case "stop":
      // Clear the interval if it exists
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      break;
  }
};
