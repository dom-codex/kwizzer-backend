module.exports.HandleUserError = (inputData, errors, req) => {
  let input = {};
  Object.keys(inputData).forEach((data) => {
    let message = "";
    const isPresent = errors.errors.some((error) => {
      message = error.msg;
      return error.param === data;
    });
    if (isPresent && data !== "password") {
      input = {
        ...input,
        [data]: { value: req.body[data], hasErr: true, msg: message },
      };
      message = "";
    } else if (data === "password" && isPresent) {
      input = {
        ...input,
        [data]: { value: "", hasErr: true, msg: message },
      };
      message = "";
    } else if (data === "password") {
      input = {
        ...input,
        [data]: { value: "", hasErr: false, msg: message },
      };
      message = "";
    } else {
      message = "";
      input = {
        ...input,
        [data]: { value: req.body[data], hasErr: false, msg: message },
      };
    }
  });
  return input;
};
