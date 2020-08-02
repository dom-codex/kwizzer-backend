module.exports.genRandomNumbers = (alreadyGen = [], questionLength) => {
  const n = Math.floor(Math.random() * questionLength) + 1;
  const ran = [];
  //check if no has been generated before
  const isGen = ran.some((num) => num === n);
  if (isGen) {
    return this.genRandomNumbers(ran, questionLength);
  } else {
    ran.push(n);
    return n;
  }
};
