angular.module('mastermindApp', [])
  .controller('MastermindController', function($timeout){
    var vm = this;
    var boardHeight = 10;
    var boardWidth = 4;

    vm.endGameTitle = "";
    vm.endGameContent = "";

    vm.newGame = function(){
      vm.colours = ['red','green','blue','yellow','brown','orange','black','white'];
      vm.board = [...Array(boardHeight).keys()].map(i => Array(boardWidth));
      vm.turn = 0;
      vm.code = [...new Array(boardWidth)].map((_, i) => vm.colours[Math.floor(Math.random() * vm.colours.length)]);
      vm.results = [...Array(boardHeight).keys()].map(i => Array(boardWidth));
      vm.endGame = false;
      vm.showEndGameModal = false;
    };
    vm.newGame();

    vm.checkDisabled = function(){
      if(vm.endGame)
        return true;

      for(var i=0; i<boardWidth;i++){
        if(vm.board[vm.turn][i]===undefined)
          return true;
      }
      return false;
    };

    vm.check = function(){
      var resultIndex = 0;
      var guess = _.clone(vm.board[vm.turn]);
      var codeToCheck = _.clone(vm.code);

      //check exact matches
      for(var i=0; i<boardWidth;i++){
        if(vm.board[vm.turn][i]===vm.code[i]){
          guess.splice(i,1, undefined);
          codeToCheck.splice(i,1, undefined);
          vm.results[vm.turn][resultIndex] = 'red';
          resultIndex++;
        }
      }
      guess = guess.filter(function(n){ return n != undefined });
      codeToCheck = codeToCheck.filter(function(n){ return n != undefined });

      //check partial matches
      for(var j=0; j<guess.length;j++){
        var indexInCode = codeToCheck.indexOf(guess[j]);
        if(indexInCode!==-1){
          codeToCheck.splice(indexInCode,1);
          vm.results[vm.turn][resultIndex] = 'white';
          resultIndex++;
        }
      }

      if(_.isEqual(vm.results[vm.turn],Array(boardWidth).fill('red'))){
        vm.endGame = true;
        // alert('WIN!');
        showOutcomeModal(true);
      }else{
        vm.turn++;
        if(vm.turn>=boardHeight){
          vm.endGame = true;
          showOutcomeModal(false);
          // alert('game over :(');
        }
      }
    };

    vm.selectColour = function(colour){
      for(var i=0; i<boardWidth;i++){
        if(vm.board[vm.turn][i]===undefined){
          vm.board[vm.turn][i]=colour;
          break;
        }
      }
    };

    vm.clearRow = function(){
      vm.board[vm.turn] = Array(boardWidth);
    };

    var showOutcomeModal = function(didWin=true){
      if(didWin){
        vm.endGameTitle = "Win!";
        vm.endGameContent = "Congradulations! You won in "+(vm.turn+1)+" turns!";
      }else{
        vm.endGameTitle = "Game Over";
        vm.endGameContent = "You did not win 😟";
      }
      vm.showEndGameModal = true;
    }
    vm.closeModal = function(){vm.showEndGameModal=false;}

    vm.help = function(){
      $('body').chardinJs('toggle');
    };

    //PLAY SELF
    var possibilities = [], outcomes = [], firstPass=true;
    vm.startPlaySelf = function(){
      $('body').chardinJs('stop');
      possibilities = Combinatorics.baseN(vm.colours,boardWidth).toArray();

      outcomes = Combinatorics.baseN(['red','white',undefined],boardWidth).toArray();
      outcomes.forEach(function(el){el.sort()});
      outcomes = _.uniq(outcomes, function(a){return JSON.stringify(a)});

      firstPass = true;

      vm.playSelf([vm.colours[0],vm.colours[0],vm.colours[1],vm.colours[1]]);
    };

    vm.playSelf = function(sequenceToGuess){
      doGuess(sequenceToGuess);

      //check if game won
      if(vm.endGame)
        return;

      //trim posibilites that cannot exist
      for(var i=0;i<possibilities.length;i++){
        var checkedResults = checkGuessToAnswer(possibilities[i], vm.board[vm.turn-1]);
        var actualResults = _.clone(vm.results[vm.turn-1]);
        if(!_.isEqual(checkedResults, actualResults)){
          possibilities.splice(i,1);
          i--;
        }
      }
      console.log('evaluating '+possibilities.length+' possibilities');

      //make a second guess on the first pass to eliminate possibilities and speed up the process
      //this can result in one extra guess but saves up to 1min 10sec.
      if(firstPass){
        firstPass = false;
        vm.playSelf([vm.colours[2],vm.colours[2],vm.colours[3],vm.colours[3]]);
        return;
      }

      //find the solution that will provide the most info
      var min = Number.MAX_VALUE;
      var minCombination = null;
      for(var guess in possibilities){
        var max = 0;
        for(var outcome in outcomes){
          var count = 0;
          for(var solution in possibilities){
            if(_.isEqual(checkGuessToAnswer(possibilities[guess], possibilities[solution]), outcomes[outcome]))
              count++;
          }
          if(count > max)
            max = count;
        }
        if(max < min){
          min = max;
          minCombination = possibilities[guess];
        }
      }

      //create the illusion of thinking
      $timeout(function(){vm.playSelf(minCombination);},300);
    };

    function doGuess(sequenceToGuess){
      for(var i=0;i<boardWidth;i++){
        vm.selectColour(sequenceToGuess[i]);
      }
      vm.check();
    }

    function checkGuessToAnswer(guessInput, answerInput){
      var guess = _.clone(guessInput);
      var answer = _.clone(answerInput);
      var resultIndex = 0;
      // var lastGuess = _.clone(guess);
      // var codeToCheck = _.clone(possibility);
      var testResults = Array(boardWidth);
      // var lastResult = vm.results[vm.turn-1];

      //check exact matches
      for(var i=0; i<boardWidth;i++){
        if(guess[i]===answer[i]){
          guess.splice(i,1, undefined);
          answer.splice(i,1, undefined);
          testResults[resultIndex] = 'red';
          resultIndex++;
        }
      }
      guess = guess.filter(function(n){ return n != undefined });
      answer = answer.filter(function(n){ return n != undefined });

      //check partial matches
      for(var j=0; j<guess.length;j++){
        var indexInCode = answer.indexOf(guess[j]);
        if(indexInCode!==-1){
          answer.splice(indexInCode,1);
          testResults[resultIndex] = 'white';
          resultIndex++;
        }
      }
      return testResults;
    }

  });
