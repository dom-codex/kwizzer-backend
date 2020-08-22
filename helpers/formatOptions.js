module.exports.formatOptions = (options, answer, id, isNew) => {
  let answerCount = 0;
  let reformedOptions = [];
  //Object.keys(options)
  if (!isNew) {
    options = options.filter((option) => option.id !== 0);
  }
  options.forEach((option) => {
    if (option.value === answer) {
      reformedOptions.push({
        option: option.value,
        isAnswer: true,
        questionId: id,
      });
      answerCount++;
    } else {
      reformedOptions.push({
        option: option.value,
        isAnswer: false,
        questionId: id,
      });
    }
  });
  return { options: reformedOptions, n: answerCount };
};
