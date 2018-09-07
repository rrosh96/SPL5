import { close } from 'fs';

/*
 * bot.js
 *
 * Main logic of the bot resides in this file.
 *
 * This Bot class recieves an incoming request, look at the
 * data, figures out the response and then send it back.
 *
 */

const SplClient = require('./splClient.js');

class Bot {
    constructor(host, port) {
        this.splClient = new SplClient(host, port, this.request.bind(this));
    }

    start() {
        this.splClient.listen();
    }

    /*
     * Entry point for each incoming request from SBOX
     *
     */
    request(data) {
        try {
            switch(data.dataType.trim()) {
                case "authentication" :
                    this.authentication(data);
                    break;
                case "command" :
                    this.move(data);
                    break;
                case "acknowledge" :
                    this.acknowledgement(data);
                    break;
                case "result" :
                    this.result(data);
                    break;
            }
        } catch (err) {
            
            
        }
    }

    authentication(data) {
        // Send back the one-time-password that
        // was received in the request.
        let response = {
            dataType: 'oneTimePassword',
            oneTimePassword: data.oneTimePassword,
        };
        this.splClient.respond(response);
    }

    acknowledgement(data) {
        
    }

    result(data) {
        
    }


    findBotPositions(idArray) {
        let self = this;
        let boardInfo = this.request.boardInfo;
        let temp = {};
        idArray.forEach(function(id){
            temp[id] = [];
            let size = boardInfo.length;
            for(let i = 0; i < size; i++){
                for(let j = 0; j < size; j++){
                    if(id === boardInfo[i][j]){
                        temp[id].push([i,j]);
                    }
                }
            }
        })
        
        return temp;
    }

    // Removes all positions that are out of boundary
    filterOutOfBoundaryMoves (positions) {
        let size = this.request.boardInfo.length;
        return positions.filter(function (pos) {
            return ((pos[0] >= 0 && pos[0] < size) && (pos[1] >= 0 && pos[1] < size))
        })
    }

    // Removes all position with the specific id
    filterById (positions, id) {
        let boardInfo = this.request.boardInfo;
        return positions.filter(function (pos) {
            let i = pos[0],
            j = pos[1];
            return id.indexOf(boardInfo[i][j]) === -1;
        });
    }

    //Returns all position relative to cellPos and step from cellPos
    findAllPositions (cellPos, step) {
        return [
            [cellPos[0] - step, cellPos[1] - step],
            [cellPos[0] - step, cellPos[1]],
            [cellPos[0] - step, cellPos[1] + step],
            [cellPos[0], cellPos[1] - step],
            [cellPos[0], cellPos[1] + step],
            [cellPos[0] + step, cellPos[1] - step],
            [cellPos[0] + step, cellPos[1]],
            [cellPos[0] + step, cellPos[1] + step]
        ]
    }

    findTopPositions (cellPos, step) {
        return [
            [cellPos[0] - step, cellPos[1]],
            [cellPos[0] - step, cellPos[1] - step],
            [cellPos[0] - step, cellPos[1] + step],
        ]
    }

    findBottomPositions (cellPos, step) {
        return [
            [cellPos[0] + step, cellPos[1]],
            [cellPos[0] + step, cellPos[1] - step],
            [cellPos[0] + step, cellPos[1] + step]
        ]
    }

    findNumberOfOpps(cellpos, myID){
        let adjPostions = this.findAllPositions(cellpos, 1);
        let filter1 = this.filterOutOfBoundaryMoves(adjPostions);
        let filter2 = this.filterById(filter1, [myID, -1, 0]);

        return filter2.length;
    }

    //Returns only the possible positions from the cellPos
    findOnlyPossibePositions (cellPos, step, myID, oppID ) {

        // getAll possible moves 
        let allPos = this.findAllPositions(cellPos, step);

        let filter1 = this.filterOutOfBoundaryMoves(allPos);
        
        // filter by both opp bot id and block id
        let filter2 = this.filterById(filter1, [myID, oppID, -1]);
        return filter2;
    }

    shallWeAttack(myPositionsArr,myID, oppID){
         // Attack Logic
         let self = this;
         let maxKillObj = {
            max: 0,
            fromCell: [], //[6,0]
            toCell: [] // [1,2]
        }

        myPositionsArr[myID].forEach(function(pos){
            let movesArr =  self.findOnlyPossibePositions(pos, 1, myID, oppID);
            movesArr.push(...self.findOnlyPossibePositions(pos, 2, myID, oppID));
            movesArr.forEach(function(move){
                
                // find all adj positon of this move and filter by ourID and block in order to find the max Kills
                let killCount = self.findNumberOfOpps(move, myID)
                if(killCount > maxKillObj.max){
                    maxKillObj.max = killCount;
                    maxKillObj.fromCell = pos;
                    maxKillObj.toCell = move;
                }
                 
            })
        })

        return maxKillObj;
    }

    moveTowardsTop (cellPos, myID, oppID) {
        let topPositions = this.findTopPositions(cellPos, 1);
        let filter1 = this.filterOutOfBoundaryMoves(topPositions);
        let filter2 = this.filterById(myID, oppID, -1);
        return filter2;
    }

    moveTowardsBottom (cellPos, myID, oppID) {
        let bottomPosition = this.findBottomPositions(cellPos, 1);
        let filter1 = this.filterOutOfBoundaryMoves(bottomPosition);
        let filter2 = this.filterById(myID, oppID, -1);
        return filter2;
    }

    findClosestToOpp (myPositionsArr, myID, oppID) {
        let closestPos = [];
        let size = myPositionsArr.length;
        let retArr = [];
        let self = this;

        {
            if (myID === 1) {
                let minVal = self.request.boardInfo.length;
                for (let i=0; i<size; i++) {
                    for (let j=0; j<size; j++) {
                        if (i < minVal) {
                            minVal = i;
                            retArr = [];
                            retArr.push[i,j];
                        } else if (i === minVal) {
                            retArr.push[i,j];
                        }
                    }
                }

                retArr.forEach(function (pos) {
                    let move = self.moveTowardsTop(pos, myID, oppID);
                    if (move.length !== 0) {
                        return {
                            fromPos: pos,
                            toPos: move[0],
                        }
                    }
                });

            } else {
                let maxVal = 0;
                for (let i=size-1; i>=0; i--) {
                    for (let j=size-1; j>=0; j--) {
                        if (i > maxVal) {
                            maxVal = i;
                            retArr = [];
                            retArr.push[i,j];
                        } else if (i === maxVal) {
                            retArr.push[i,j];
                        }
                    }
                }
                retArr.forEach(function (pos) {
                    let move = self.moveTowardsBottom (pos, myID, oppID);
                    if (move.length !== 0) {
                        return {
                            fromPos: pos,
                            toPos: move[0],
                        }
                    }
                });
            }
            return "Failed";
        }
    }

    // findPossibleMoves (cellPos, step) {
    //     return this.findOnlyPossibePositions(cellPos, step);
    // }



    /* wife(myID, oppID, myPositionsArr, movesArr){
        let myRandomPos = myPositionsArr[Math.floor(Math.random()* myPositionsArr.length)];
        let myRandomMove = movesArr[Math.floor(Math.random()* movesArr.length)];
        return myRandomMove;
    } */

    
    // takes request as param
    // return complete respons object 
    wife(){


        // assign variable to freq used params, myID, oppID 
        let myID = this.request.yourID;
        let oppID = myID === 1 ? 2: 1;
        let size = this.request.boardInfo.length, 
            movesArr = [],
            myRandomPos = [],
            myRandomMove = [];



        // return object  of Bot Position for the corresponding ID 
        // obj = {myID : [], oppID : []}
        let myPositionsArr = this.findBotPositions([myID]);

        let canAttack = this.shallWeAttack(myPositionsArr,myID, oppID);

        if(canAttack.max !== 0){   
            return {
                dataType: "response",
                fromCell: canAttack.fromCell, //[6,0]
                toCell: canAttack.toCell // [1,2]
            }
        }
        // Move towards opponent Logic
        let closeMove = this.findClosestToOpp (myPositionsArr, myID, oppID);
        if (closeMove !== "Failed") {
            return {
                dataType: "response",
                fromCell: closeMove.fromPos, //[6,0]
                toCell: closeMove.toPos // [1,2]
            }
        }


        //Killer Logic
        
        while(movesArr.length == 0) {
            myRandomPos = myPositionsArr[myID][Math.floor(Math.random() * myPositionsArr[myID].length)];
            movesArr = this.findOnlyPossibePositions(myRandomPos, 1, myID, oppID);
            if(movesArr.length === 0){
                // movesArr.push(...this.findOnlyPossibePositions(myRandomPos, 2, myID, oppID));
            }
            if(movesArr.length ===0){
                console.info("MyRandomMove is empty", "->moves Arr ", movesArr, "-MyRandomPos :", myRandomPos )
            } else {
                myRandomMove = movesArr[Math.floor(Math.random()* movesArr.length)];
            }

        }

        // Attack Logic
 
        return {
            dataType: "response",
            fromCell: myRandomPos, //[6,0]
            toCell: myRandomMove // [1,2]
        }
    }
    
    move(request) {
        
        this.request = request;
        //
        // ** Move logic here. **
        //

        //this.whatsMyMove();
        

        let response = this.wife();

        
        this.splClient.respond(response);
    }
    
    
}

module.exports = Bot;
