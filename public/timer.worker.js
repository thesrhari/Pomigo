let timerId = null;
let timeLeft = 0;
let startTime = null;
let expectedDuration = 0;
let highResTimerId = null;
let broadcastChannel = null;

try {
  if (typeof BroadcastChannel !== "undefined") {
    broadcastChannel = new BroadcastChannel("pomodoro-timer");
  }
} catch (err) {
  console.warn("BroadcastChannel not available");
}

function startHighResTimer() {
  if (highResTimerId) {
    clearTimeout(highResTimerId);
  }

  const tick = () => {
    if (timeLeft <= 0) return;

    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    const calculatedTimeLeft = Math.max(0, expectedDuration - elapsedSeconds);

    timeLeft = calculatedTimeLeft;

    if (timeLeft > 0) {
      self.postMessage({ type: "tick", timeLeft: timeLeft });

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

      const delay = 900 + Math.random() * 200;
      highResTimerId = setTimeout(tick, delay);
    } else {
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

self.addEventListener("message", function (e) {
  if (e.data.type === "visibility-change") {
    if (timeLeft > 0 && startTime) {
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

self.onmessage = function (e) {
  const { command, duration } = e.data;

  switch (command) {
    case "start":
      cleanup();

      timeLeft = duration;
      expectedDuration = duration;
      startTime = Date.now();

      timerId = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const calculatedTimeLeft = Math.max(
          0,
          expectedDuration - elapsedSeconds
        );

        const decrementedTime = timeLeft - 1;
        timeLeft = Math.min(decrementedTime, calculatedTimeLeft);

        if (timeLeft > 0) {
          self.postMessage({ type: "tick", timeLeft: timeLeft });
        } else {
          self.postMessage({ type: "sessionEnd" });
          cleanup();
        }
      }, 1000);

      startHighResTimer();

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

if (broadcastChannel) {
  broadcastChannel.onmessage = function (e) {
    const { type, timeLeft: syncTimeLeft, timestamp } = e.data;

    if (type === "timer-update" && syncTimeLeft !== undefined) {
      const now = Date.now();
      const timeDiff = Math.abs(now - timestamp);

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

let heartbeatInterval = setInterval(() => {
  self.postMessage({
    type: "heartbeat",
    timestamp: Date.now(),
    isActive: timerId !== null,
  });
}, 5000);

self.addEventListener("beforeunload", cleanup);
