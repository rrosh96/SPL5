
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
        if(step ===1 ){

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
        } else {
             return [
                [cellPos[0] - 2, cellPos[1] - 2],
                [cellPos[0] - 2, cellPos[1] - 1],
                [cellPos[0] - 2, cellPos[1]],
                [cellPos[0] - 2, cellPos[1] + 1],
                [cellPos[0] - 2, cellPos[1] + 2],
                [cellPos[0] - 1, cellPos[1] - 2],
                [cellPos[0] - 1, cellPos[1] + 2],
                [cellPos[0], cellPos[1] - 2],
                [cellPos[0], cellPos[1] + 2],
                [cellPos[0] + 1, cellPos[1] - 2],
                [cellPos[0] + 1, cellPos[1] + 2],
                [cellPos[0] + 2, cellPos[1] - 2],
                [cellPos[0] + 2, cellPos[1] - 1],
                [cellPos[0] + 2, cellPos[1]],
                [cellPos[0] + 2, cellPos[1] + 1],
                [cellPos[0] + 2, cellPos[1] + 2],
            ]
        }

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
        };
        let maxJumpKillObj = {
            max: 0,
            suicideDiff : 0,
            fromCell: [], //[6,0]
            toCell: []
        }

        myPositionsArr[myID].forEach(function(pos){
            let movesArrClone =  self.findOnlyPossibePositions(pos, 1, myID, oppID);
            // movesArr.push(...self.findOnlyPossibePositions(pos, 2, myID, oppID));
            movesArrClone.forEach(function(move){
                
                // find all adj positon of this move and filter by ourID and block in order to find the max Kills
                let killCount = self.findNumberOfOpps(move, myID)
                if(killCount > maxKillObj.max){
                    maxKillObj.max = killCount;
                    maxKillObj.fromCell = pos;
                    maxKillObj.toCell = move;
                }
                 
            })
        });

        myPositionsArr[myID].forEach(function(pos){
            let movesArrJump = self.findOnlyPossibePositions(pos, 2, myID, oppID);
            movesArrJump.forEach(function(move){
                
                // find all adj positon of this move and filter by ourID and block in order to find the max Kills
                let killCount = self.findNumberOfOpps(move, myID);
                // find all adf positoin of current pos and filter out their ID and blocks.
                let suicideCount = self.findNumberOfOpps(pos, oppID);
                let suicideDiff = killCount - suicideCount;
                if(killCount >= (maxJumpKillObj.max)){
                    if((suicideDiff > 0) &&  (suicideDiff > maxJumpKillObj.suicideDiff)){
                        maxJumpKillObj.suicideDiff = suicideDiff;
                        maxJumpKillObj.max = killCount;
                        maxJumpKillObj.fromCell = pos;
                        maxJumpKillObj.toCell = move;
                    }
                }
                 
            })

        });
        if (maxJumpKillObj.max > 2 + maxKillObj.max) {
            return maxJumpKillObj;
        } else {
            return maxKillObj;
        }
    }

    lastResort (myPositionsArr, myID, oppID) {
        let self = this;
        let maxJumpKillObj = {
            max: 0,
            suicideDiff : -9,
            fromCell: [0,0],
            toCell: [0,0]
        }

        myPositionsArr[myID].forEach(function(pos){
            let movesArrJump = self.findOnlyPossibePositions(pos, 2, myID, oppID);
            movesArrJump.forEach(function(move){
                
                // find all adj positon of this move and filter by ourID and block in order to find the max Kills
                let killCount = self.findNumberOfOpps(move, myID);
                // find all adf positoin of current pos and filter out their ID and blocks.
                let suicideCount = self.findNumberOfOpps(pos, oppID);
                let suicideDiff = killCount - suicideCount;
                if(killCount >= (maxJumpKillObj.max)){
                    if((suicideDiff > maxJumpKillObj.suicideDiff)){
                        maxJumpKillObj.suicideDiff = suicideDiff;
                        maxJumpKillObj.max = killCount;
                        maxJumpKillObj.fromCell = pos;
                        maxJumpKillObj.toCell = move;
                    }
                }
            })
        });
        return maxJumpKillObj;
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


    fillAdjacentGrid(myPositionsArr,  myID, oppID){
        let size = this.request.boardInfo.length;
        let self = this;
        let returnObj = undefined;
        if(myID === 2){
            for(let i = size-1; i >= 0; i--){
                for(let j = 0; j< size; j++){
                    let movesArr = [];
                    
                    myPositionsArr[myID].every(function(pos){
                        movesArr = self.findOnlyPossibePositions(pos, 1, myID, oppID);
                        let a = JSON.stringify(movesArr);
                        let b = "[" + i.toString() + "," + j.toString() + "]";
                        if(a.indexOf(b) !== -1){
                           returnObj = {
                                dataType: "response",
                                fromCell: pos, //[6,0]
                                toCell: [i,j] // [1,2]
                            };
                            return false;
                        }else {
                            return true;
                        }
                    })
                    
                    if(typeof returnObj !== "undefined"){
                        break;
                    }    
                    
                }
                if(typeof returnObj !== "undefined"){
                    break;
                }  
            }
        } else {
            for(let i = 0; i < size; i++){
                for(let j = size-1; j >=0; j--){
                    let movesArr = [];
                    
                    myPositionsArr[myID].every(function(pos){
                        movesArr = self.findOnlyPossibePositions(pos, 1, myID, oppID);
                        let a = JSON.stringify(movesArr);
                        let b = "[" + i.toString() + "," + j.toString() + "]";
                        if(a.indexOf(b) !== -1){
                           returnObj = {
                                dataType: "response",
                                fromCell: pos, //[6,0]
                                toCell: [i,j] // [1,2]
                            };
                            return false;
                        }else {
                            return true;
                        }
                    })
                    
                    if(typeof returnObj !== "undefined"){
                        break;
                    }    
                    
                }
                if(typeof returnObj !== "undefined"){
                    break;
                }  
            }
        }

        return returnObj;
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
        } else {
            let adjacentGrid = this.fillAdjacentGrid(myPositionsArr,  myID, oppID);
            if (typeof adjacentGrid === "undefined") {
                let lastJump = this.lastResort(myPositionsArr,  myID, oppID);
                return {
                        dataType: "response",
                        fromCell: lastJump.fromCell, //[6,0]
                        toCell: lastJump.toCell // [1,2]
                    };
            } else {
                return adjacentGrid;
            }
        }
        // Move towards opponent Logic
        // let closeMove = this.findClosestToOpp (myPositionsArr, myID, oppID);
        // if (closeMove !== "Failed") {
        //     return {
        //         dataType: "response",
        //         fromCell: closeMove.fromPos, //[6,0]
        //         toCell: closeMove.toPos // [1,2]
        //     }
        // }


        //Killer Logic
        
        // while(movesArr.length == 0) {
        //     myRandomPos = myPositionsArr[myID][Math.floor(Math.random() * myPositionsArr[myID].length)];
        //     movesArr = this.findOnlyPossibePositions(myRandomPos, 1, myID, oppID);
        //     if(movesArr.length === 0){
        //         // movesArr.push(...this.findOnlyPossibePositions(myRandomPos, 2, myID, oppID));
        //     }
        //     if(movesArr.length ===0){
        //         console.info("MyRandomMove is empty", "->moves Arr ", movesArr, "-MyRandomPos :", myRandomPos )
        //     } else {
        //         myRandomMove = movesArr[Math.floor(Math.random()* movesArr.length)];
        //     }

        // }
        // return {
        //     dataType: "response",
        //     fromCell: myRandomPos, //[6,0]
        //     toCell: myRandomMove // [1,2]
        // }
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
