module.exports.formatOptions = (options, answer) => {
  let reformedOptions = [];
  console.log("wher");
  Object.keys(options).forEach((key) => {
    if (key === answer) {
      reformedOptions.push({
        option: options[key],
        isAnswer: true,
      });
    } else {
      reformedOptions.push({
        option: options[key],
        isAnswer: false,
      });
    }
  });
  return reformedOptions;
};
