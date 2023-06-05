// This is a collection of moves

/*

Levine and Marks 1928 IQ classification
          => 175  Precocious    100%
=> 150 && =< 174  Very superior 90%
=> 125 && =< 149  Superior      80%
=> 115 && =< 124  Very bright   70%
=> 105 && =< 114  Bright        60%
=> 95 && =< 104   Average       50%
=> 85 && =< 94    Dull          40%
=> 75 && =< 84    Borderline    30%
=> 50 && =< 74    Moron         20%
=> 25 && =< 49    Imbecile      10%
=> 0 && 24        Idiot         0%

Moves

Random but valid moves
now - looks ahead for blocking player wins and computer wins, this move, with the current state of the board
1 move ahead - if not then the cartesian relation between every first move and every second mov - for larger boards
    that might take a while, especially if there are a lot of games being played
2 or more moves ahead, perhaps only done when there are a smaller number of moves remaining
end - look ahead as many moves as it takes, to the last winning move

Different difficulty settings will:
    - choose a different range of looking ahead depending on the number of remaining moves.
    - win or lose a certain percentage of the time getting dumber or smarter depending on the player
    - set a time limit for looking ahead.  After the time is expired it gives the best set of moves and chooses one
    randomly.  The search will not be sequential but a shuffled.
    - no time limit.  With every board no matter how big search every possibility until it finds the shortest winning
    path.  Would require a quantum computer, even then...

Save a collection of winning paths?  Use the client's computers to accumulate moves ahead of time!

game {
    em:3,
    en:3,
    timeMS:293847298 // the amount of time in ms it took to construct this model
    patterns:[
        [[1, 1, 1]], // horizontal
        [[1], [1], [1]], // vertical
        [[1, 0, 0], [0, 1, 0], [0, 0, 1]], // backslash
        [[0, 0, 1], [0, 1, 0], [1, 0, 0]] // forward slash
        // any valid pattern
    ],
    edges:[ // the board states are vertices of the graph and the transitions are the edges
        {
            f:19680, // from - base 3 numbers representing a board state
            t:19682, // to
            s:2,     // state -> 0 - in-play, 1 - X wins, 2 - O wins (given the patterns in this game)
            l:10     // level - How many moves did it take to reach this point?
        },
        { f:19680, t:19682, s:2, l:10 },
        { f:19680, t:19682, s:2, l:10 },
        { f:19680, t:19682, s:2, l:10 },
        { f:19680, t:19682, s:2, l:10 },
        { f:19680, t:19682, s:2, l:10 }
        .
        .
        .
    ]
}

Make a list of edges that branch off from current board state then when trying to find the right move take the current
state and find all the branches that lead to the computer win.  Choose the one with the smallest level number.  If there
are many with the same smallest number, then choose one randomly.  Do that for each move.  Each level of difficulty
increases a percentage that some other not so good choice will be taken.  Precocious level always chooses an optimal
move.

*/

module.exports = {};

// returns a random valid move
module.exports.randomMove = function() {}

// returns an array of moves which are either winning, blocking, or neither and valid
module.exports.nowMove = function() {}

// returns an array of moves
module.exports.lookAheadMove = function() {}

/*



 */