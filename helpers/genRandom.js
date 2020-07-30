module.exports.genRandomNumbers = (alreadyGen, questionLength) => {
  const n = Math.floor(Math.random() * questionLength) + 1;
  //check if no has been generated before
  const isGen = alreadyGen.some((num) => num === n);
  if (isGen) {
    return this.genRandomNumbers(alreadyGen, questionLength);
  } else {
    alreadyGen.push(n);
    return n;
  }
};
