module.exports = {

  shuffleArray(array) {
    let currentIndex = array.length;
    let temporaryValue = null;
    let randomIndex = null;

    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      /* eslint-disable no-param-reassign */
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
      /* eslint-enable no-param-reassign */
    }

    return array;
  },

};
