/* eslint indent: ["error", 2, { "SwitchCase": 1 }] */ "use strict";



//	P A C K A G E

const { exec } = require("child_process");



//	P R O G R A M

const sessions = {};

const debounce = (func, wait, immediate) => {
  let timeout;

  return function () {
    const context = this;
    const args = arguments;

    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
};

const setTitle = (pid, uid) => {
  exec(`lsof -p ${pid} | grep cwd | tr -s " " | cut -d " " -f9-`, (err, cwd) => {
    if (err) {
      console.error(err);
    } else {
      cwd = cwd.split("/").pop().replace("\n", "");

      if (cwd === process.env.USER) cwd = "~";
      else if (cwd === "") cwd = "/";

      store.dispatch({ // eslint-disable-line
        type: "SESSION_SET_XTERM_TITLE",
        title: cwd,
        uid
      });
    }
  });
};

const debouncedTitle = debounce(setTitle, 10);



//	E X P O R T

exports.middleware = (store) => (next) => (action) => { // eslint-disable-line
  switch (action.type) {
    case "SESSION_ADD":
      sessions[action.uid] = {
        pid: action.pid
      };

      break;

    case "SESSION_PTY_EXIT":
    case "SESSION_USER_EXIT":
      delete sessions[action.uid];
      break;

    case "SESSION_PTY_DATA": {
      let session = sessions[action.uid];
      debouncedTitle(session.pid, action.uid);

      break;
    }

    case "SESSION_SET_PROCESS_TITLE": {
      const session = sessions[action.uid];
      debouncedTitle(session.pid, action.uid);

      break;
    }
  }

  next(action);
};
